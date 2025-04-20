"use client"

import { useMemo } from "react"

import type React from "react"
import { useState, useCallback, useTransition, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { SpotifyPlaylist } from "@/lib/spotify-api"
import { addSpotifyPlaylist } from "@/lib/actions/playlist-actions"
import {
  PRIMARY_GENRES,
  SUBGENRES,
  MOODS,
  TEMPOS,
  VOCALS,
  ERAS,
  LANGUAGES,
  SUBGENRE_DISPLAY_MAP,
} from "@/lib/playlists"
import { Music } from "lucide-react"

interface PlaylistDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  playlist: SpotifyPlaylist
  onPlaylistAdded: () => void
}

export function PlaylistDetailsModal({ isOpen, onClose, playlist, onPlaylistAdded }: PlaylistDetailsModalProps) {
  const [isPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<any>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [submissionAttempted, setSubmissionAttempted] = useState(false)
  const [formValid, setFormValid] = useState(true)

  // Track submission status to prevent duplicate submissions
  const submissionInProgressRef = useRef(false)

  // Reset form and state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset states when modal opens
      setError(null)
      setSuccess(null)
      setIsSubmitting(false)
      setSubmissionAttempted(false)
      submissionInProgressRef.current = false
    }
  }, [isOpen])

  // Validate form before submission
  const validateForm = useCallback((formData: FormData): boolean => {
    // Check required fields
    const primaryGenre = formData.get("primaryGenre")
    const vocal = formData.get("vocal")
    const language = formData.get("language")

    if (!primaryGenre || !vocal || !language) {
      setError({ _form: ["Please fill in all required fields"] })
      return false
    }

    // Check at least one subgenre is selected
    const subgenres = formData.getAll("subgenres")
    if (subgenres.length === 0) {
      setError({ subgenres: ["Please select at least one subgenre"] })
      return false
    }

    return true
  }, [])

  // Optimize form submission with useCallback
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      // Set submission attempted flag for validation feedback
      setSubmissionAttempted(true)

      // Prevent duplicate submissions
      if (submissionInProgressRef.current) {
        console.log("Submission already in progress, ignoring duplicate submission")
        return
      }

      setIsSubmitting(true)
      submissionInProgressRef.current = true
      setError(null)
      setSuccess(null)

      try {
        const formData = new FormData(e.currentTarget)

        // Validate that we have the playlist ID
        if (!playlist.id) {
          throw new Error("Missing playlist ID")
        }

        // Validate form
        if (!validateForm(formData)) {
          setIsSubmitting(false)
          submissionInProgressRef.current = false
          return
        }

        formData.append("spotifyId", playlist.id)

        // Use startTransition for non-urgent UI updates
        startTransition(async () => {
          try {
            console.log("Submitting playlist with ID:", playlist.id)
            const result = await addSpotifyPlaylist(null, formData)

            if (result.success) {
              console.log("Playlist added successfully:", result)
              setSuccess(result.message || "Playlist added successfully")

              // Delay closing the modal to show success message
              setTimeout(() => {
                onPlaylistAdded()
              }, 1500)
            } else {
              console.error("Failed to add playlist:", result.error)
              setError(result.error || { _form: ["Failed to add playlist"] })
              submissionInProgressRef.current = false
            }
          } catch (err: any) {
            console.error("Error adding playlist:", err)
            setError({ _form: [`An unexpected error occurred: ${err.message || "Unknown error"}`] })
            submissionInProgressRef.current = false
          } finally {
            setIsSubmitting(false)
          }
        })
      } catch (err: any) {
        console.error("Form submission error:", err)
        setError({ _form: [`An unexpected error occurred: ${err.message || "Unknown error"}`] })
        setIsSubmitting(false)
        submissionInProgressRef.current = false
      }
    },
    [playlist.id, onPlaylistAdded, validateForm],
  )

  // Reset form and state when modal opens/closes
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Reset form when closing
        if (formRef.current) {
          formRef.current.reset()
        }
        setError(null)
        setSuccess(null)
        setIsSubmitting(false)
        submissionInProgressRef.current = false
        onClose()
      }
    },
    [onClose],
  )

  // Optimize image rendering with error handling
  const [imageError, setImageError] = useState(false)

  const playlistImage = useMemo(() => {
    if (imageError || !playlist?.images?.length || !playlist.images[0]?.url) {
      return <Music className="h-8 w-8 m-4 text-muted-foreground" />
    }

    return (
      <img
        src={playlist.images[0].url || "/placeholder.svg"}
        alt={playlist.name}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setImageError(true)}
      />
    )
  }, [playlist, imageError])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Playlist Details</DialogTitle>
        </DialogHeader>

        <div className="flex items-center mb-4">
          <div className="h-16 w-16 flex-shrink-0 bg-muted">{playlistImage}</div>
          <div className="ml-4 flex-1 overflow-hidden">
            <h3 className="font-medium truncate">{playlist.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              By {playlist.owner?.display_name || "Unknown"} • {playlist.tracks?.total || 0} tracks
            </p>
            <p className="text-sm text-muted-foreground">
              {(playlist.followers?.total || 0).toLocaleString()} followers
            </p>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primaryGenre">Primary Genre *</Label>
            <select
              id="primaryGenre"
              name="primaryGenre"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              defaultValue={PRIMARY_GENRES[0]}
            >
              {PRIMARY_GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            {error?.primaryGenre && <p className="text-sm text-destructive">{error.primaryGenre[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label>Subgenres (select at least one) *</Label>
            <div
              className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-2"
              data-subgenres-container
            >
              {SUBGENRES.map((subgenre) => (
                <div key={subgenre} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`subgenre-${subgenre}`}
                    name="subgenres"
                    value={subgenre}
                    className="mr-2"
                  />
                  <label htmlFor={`subgenre-${subgenre}`} className="text-sm">
                    {SUBGENRE_DISPLAY_MAP[subgenre] || subgenre}
                  </label>
                </div>
              ))}
            </div>
            {error?.subgenres && <p className="text-sm text-destructive">{error.subgenres[0]}</p>}
            {submissionAttempted &&
              formRef.current &&
              formRef.current.querySelectorAll('input[name="subgenres"]:checked').length === 0 && (
                <p className="text-sm text-destructive">Please select at least one subgenre</p>
              )}
          </div>

          <div className="space-y-2">
            <Label>Moods (select all that apply)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-2">
              {MOODS.map((mood) => (
                <div key={mood} className="flex items-center">
                  <input type="checkbox" id={`mood-${mood}`} name="moods" value={mood} className="mr-2" />
                  <label htmlFor={`mood-${mood}`} className="text-sm">
                    {mood}
                  </label>
                </div>
              ))}
            </div>
            {error?.moods && <p className="text-sm text-destructive">{error.moods[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label>Tempo (select all that apply)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-2">
              {TEMPOS.map((tempo) => (
                <div key={tempo} className="flex items-center">
                  <input type="checkbox" id={`tempo-${tempo}`} name="tempos" value={tempo} className="mr-2" />
                  <label htmlFor={`tempo-${tempo}`} className="text-sm">
                    {tempo}
                  </label>
                </div>
              ))}
            </div>
            {error?.tempos && <p className="text-sm text-destructive">{error.tempos[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vocal">Vocal *</Label>
            <select
              id="vocal"
              name="vocal"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              defaultValue={VOCALS[0]}
            >
              {VOCALS.map((vocal) => (
                <option key={vocal} value={vocal}>
                  {vocal}
                </option>
              ))}
            </select>
            {error?.vocal && <p className="text-sm text-destructive">{error.vocal[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label>Era (select all that apply)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-2">
              {ERAS.map((era) => (
                <div key={era} className="flex items-center">
                  <input type="checkbox" id={`era-${era}`} name="eras" value={era} className="mr-2" />
                  <label htmlFor={`era-${era}`} className="text-sm">
                    {era}
                  </label>
                </div>
              ))}
            </div>
            {error?.eras && <p className="text-sm text-destructive">{error.eras[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language *</Label>
            <select
              id="language"
              name="language"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              defaultValue={LANGUAGES[0]}
            >
              {LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
            {error?.language && <p className="text-sm text-destructive">{error.language[0]}</p>}
          </div>

          {error?._form && (
            <Alert variant="destructive">
              <AlertDescription>{Array.isArray(error._form) ? error._form[0] : error._form}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isPending}>
              {isSubmitting || isPending ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Playlist"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
