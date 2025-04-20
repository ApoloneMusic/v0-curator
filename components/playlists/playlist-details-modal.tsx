"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { addSpotifyPlaylist } from "@/lib/actions/playlist-actions"
import { PRIMARY_GENRES, MOODS, ERAS, LANGUAGES } from "@/lib/playlists"
import { Music } from "lucide-react"
import type { SpotifyPlaylist } from "@/lib/spotify-api"
import { SubgenreSelector } from "./subgenre-selector"
import { TempoSelector } from "./tempo-selector"
import { VocalSelector } from "./vocal-selector"
import { Input } from "@/components/ui/input"

interface PlaylistDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  playlist: SpotifyPlaylist | null
  onPlaylistAdded: () => void
}

export function PlaylistDetailsModal({ isOpen, onClose, playlist, onPlaylistAdded }: PlaylistDetailsModalProps) {
  // Form state
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<any>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [formValid, setFormValid] = useState(true)
  const [selectedSubgenres, setSelectedSubgenres] = useState<string[]>([])
  const [selectedTempo, setSelectedTempo] = useState("medium") // Default to medium
  const [selectedVocal, setSelectedVocal] = useState("mixed") // Default to mixed
  const [forceRender, setForceRender] = useState(0)
  const dialogContentRef = useRef<HTMLDivElement>(null)

  // Debug logging
  useEffect(() => {
    console.log("PlaylistDetailsModal rendered with props:", { isOpen, playlist: playlist?.name })
  }, [isOpen, playlist])

  // Force a re-render after the modal is opened to ensure form elements are visible
  useEffect(() => {
    if (isOpen) {
      // Force immediate render
      setForceRender((prev) => prev + 1)

      // Schedule another render after a short delay to ensure everything is visible
      const timer = setTimeout(() => {
        setForceRender((prev) => prev + 1)
      }, 50)

      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Reset state when modal opens or playlist changes
  useEffect(() => {
    if (isOpen && playlist) {
      console.log("Modal opened with playlist:", playlist.name)
      setError(null)
      setSuccess(null)
      setIsPending(false)
      setImageError(false)
      setFormValid(true)
      setSelectedSubgenres([])
      setSelectedTempo("medium")
      setSelectedVocal("mixed")

      // Focus on the first form element after a short delay
      setTimeout(() => {
        const firstSelect = dialogContentRef.current?.querySelector("select")
        if (firstSelect) {
          firstSelect.focus()
        }
      }, 100)
    }
  }, [isOpen, playlist])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("Form submitted")

    // Validate form
    if (selectedSubgenres.length === 0) {
      setError({ subgenres: ["Please select at least one subgenre"] })
      setFormValid(false)
      return
    }

    setIsPending(true)
    setError(null)
    setSuccess(null)

    try {
      // Ensure we have a valid playlist
      if (!playlist || !playlist.id) {
        throw new Error("Invalid playlist data")
      }

      // Create form data
      const formData = new FormData()

      // Add the playlist ID
      formData.append("spotifyId", playlist.id)

      // Add form fields
      formData.append("primaryGenre", (e.currentTarget.elements.namedItem("primaryGenre") as HTMLSelectElement).value)

      // Add selected subgenres
      selectedSubgenres.forEach((subgenre) => {
        formData.append("subgenres", subgenre)
      })

      // Add selected moods
      const moodCheckboxes = e.currentTarget.querySelectorAll('input[name="moods"]:checked')
      moodCheckboxes.forEach((checkbox) => {
        formData.append("moods", (checkbox as HTMLInputElement).value)
      })

      // Add tempo
      formData.append("tempos", selectedTempo)

      // Add vocal
      formData.append("vocal", selectedVocal)

      // Add selected eras
      const eraCheckboxes = e.currentTarget.querySelectorAll('input[name="eras"]:checked')
      eraCheckboxes.forEach((checkbox) => {
        formData.append("eras", (checkbox as HTMLInputElement).value)
      })

      // Add language
      formData.append("language", (e.currentTarget.elements.namedItem("language") as HTMLSelectElement).value)

      // Extract name from Spotify if not provided by the user
      const name =
        (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value ||
        playlist.name ||
        playlist.external_urls?.spotify.split("/").pop() ||
        "My Playlist"

      // Add name to form data
      formData.append("name", name)

      // Submit the form
      const result = await addSpotifyPlaylist(null, formData)
      console.log("Add playlist result:", result)

      if (result.success) {
        setSuccess(result.message || "Playlist added successfully")

        // Notify parent component after a delay to show success message
        setTimeout(() => {
          onPlaylistAdded()
        }, 1500)
      } else {
        setError(result.error || { _form: ["Failed to add playlist"] })
      }
    } catch (err: any) {
      console.error("Error adding playlist:", err)
      setError({ _form: [err.message || "An unexpected error occurred"] })
    } finally {
      setIsPending(false)
    }
  }

  // If no playlist is selected, still render the Dialog but with no content
  if (!playlist) {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Playlist Details</DialogTitle>
          </DialogHeader>
          <p>No playlist selected</p>
        </DialogContent>
      </Dialog>
    )
  }

  // Extract Spotify playlist ID from URL for embedding
  const getPlaylistId = (url: string) => {
    try {
      const parts = url.split("/")
      return parts[parts.length - 1].split("?")[0]
    } catch (e) {
      return null
    }
  }

  const playlistId = playlist.external_urls?.spotify ? getPlaylistId(playlist.external_urls.spotify) : null
  const embedUrl = playlistId ? `https://open.spotify.com/embed/playlist/${playlistId}` : null

  // Get playlist image or fallback
  const playlistImage =
    !imageError && playlist.images?.length > 0 && playlist.images[0]?.url ? (
      <img
        src={playlist.images[0].url || "/placeholder.svg"}
        alt={playlist.name || "Playlist"}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setImageError(true)}
      />
    ) : (
      <Music className="h-8 w-8 m-4 text-muted-foreground" />
    )

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        console.log("Dialog onOpenChange:", open)
        if (!open) onClose()
      }}
      modal={true}
    >
      <DialogContent
        ref={dialogContentRef}
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        style={{
          visibility: "visible",
          opacity: 1,
          zIndex: 10000,
          position: "fixed",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
        forceMount
      >
        <DialogHeader>
          <DialogTitle>Add Playlist Details</DialogTitle>
        </DialogHeader>

        {/* Playlist header */}
        <div className="flex items-center mb-4 z-[10001] relative">
          <div className="h-16 w-16 flex-shrink-0 bg-muted">{playlistImage}</div>
          <div className="ml-4 flex-1 overflow-hidden">
            <h3 className="font-medium truncate">{playlist.name || "Untitled Playlist"}</h3>
            <p className="text-sm text-muted-foreground truncate">
              By {playlist.owner?.display_name || "Unknown"} • {playlist.tracks?.total || 0} tracks
            </p>
            <p className="text-sm text-muted-foreground">
              {(playlist.followers?.total || 0).toLocaleString()} followers
            </p>
          </div>
        </div>

        {/* Playlist embed */}
        {embedUrl && (
          <div className="w-full h-[80px] bg-black rounded-md overflow-hidden mb-4 z-[10001] relative">
            <iframe
              src={embedUrl}
              width="100%"
              height="80"
              frameBorder="0"
              allow="encrypted-media"
              title="Spotify Playlist"
            ></iframe>
          </div>
        )}

        {/* Playlist name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Playlist Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={playlist.name || ""}
            placeholder={playlist.name || playlist.external_urls?.spotify.split("/").pop() || "My Playlist"}
            required
          />
          {error?.name && <p className="text-sm text-destructive">{error.name[0]}</p>}
        </div>

        {/* Add playlist form - key forces re-render when modal opens */}
        <form key={`form-${forceRender}`} onSubmit={handleSubmit} className="space-y-4 z-[10001] relative">
          {/* Primary Genre */}
          <div className="space-y-2">
            <Label htmlFor="primaryGenre">
              Primary Genre <span className="text-red-500">*</span>
            </Label>
            <select
              id="primaryGenre"
              name="primaryGenre"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm z-[10001]"
              required
              defaultValue={PRIMARY_GENRES[0]}
              style={{ display: "block", visibility: "visible", zIndex: 10001 }}
            >
              {PRIMARY_GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            {error?.primaryGenre && <p className="text-sm text-destructive">{error.primaryGenre[0]}</p>}
          </div>

          {/* Subgenres - Using our new SubgenreSelector component */}
          <div className="space-y-2">
            <Label>
              Subgenres <span className="text-red-500">*</span>
              <span className="text-xs text-muted-foreground ml-1">(select at least one)</span>
            </Label>
            <SubgenreSelector
              selectedSubgenres={selectedSubgenres}
              onChange={setSelectedSubgenres}
              error={error?.subgenres?.[0]}
            />
            {error?.subgenres && <p className="text-sm text-destructive">{error.subgenres[0]}</p>}
            {selectedSubgenres.length === 0 && !formValid && (
              <p className="text-sm text-destructive">Please select at least one subgenre</p>
            )}
          </div>

          {/* Moods */}
          <div className="space-y-2">
            <Label>
              Moods <span className="text-xs text-muted-foreground ml-1">(optional)</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-2 z-[10001] relative">
              {MOODS.map((mood) => (
                <div key={mood} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`mood-${mood}`}
                    name="moods"
                    value={mood}
                    className="mr-2 z-[10001]"
                    style={{ visibility: "visible", opacity: 1, zIndex: 10001 }}
                  />
                  <label htmlFor={`mood-${mood}`} className="text-sm">
                    {mood}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Tempo - Using our new TempoSelector component */}
          <div className="space-y-2">
            <Label>
              Tempo <span className="text-red-500">*</span>
            </Label>
            <TempoSelector value={selectedTempo} onChange={setSelectedTempo} error={error?.tempos?.[0]} />
            {error?.tempos && <p className="text-sm text-destructive">{error.tempos[0]}</p>}
          </div>

          {/* Vocal - Using our new VocalSelector component */}
          <div className="space-y-2">
            <Label>
              Vocal <span className="text-red-500">*</span>
            </Label>
            <VocalSelector value={selectedVocal} onChange={setSelectedVocal} error={error?.vocal?.[0]} />
            {error?.vocal && <p className="text-sm text-destructive">{error.vocal[0]}</p>}
          </div>

          {/* Eras */}
          <div className="space-y-2">
            <Label>
              Era <span className="text-xs text-muted-foreground ml-1">(optional)</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-2 z-[10001] relative">
              {ERAS.map((era) => (
                <div key={era} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`era-${era}`}
                    name="eras"
                    value={era}
                    className="mr-2 z-[10001]"
                    style={{ visibility: "visible", opacity: 1, zIndex: 10001 }}
                  />
                  <label htmlFor={`era-${era}`} className="text-sm">
                    {era}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="language">
              Language <span className="text-red-500">*</span>
            </Label>
            <select
              id="language"
              name="language"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm z-[10001]"
              required
              defaultValue={LANGUAGES[0]}
              style={{ display: "block", visibility: "visible", zIndex: 10001 }}
            >
              {LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
            {error?.language && <p className="text-sm text-destructive">{error.language[0]}</p>}
          </div>

          {/* Form errors */}
          {error?._form && (
            <Alert variant="destructive">
              <AlertDescription>{Array.isArray(error._form) ? error._form[0] : error._form}</AlertDescription>
            </Alert>
          )}

          {/* Success message */}
          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Form actions */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || selectedSubgenres.length === 0}>
              {isPending ? (
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
