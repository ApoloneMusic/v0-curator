"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { addSpotifyPlaylist } from "@/lib/actions/playlist-actions"
import { Music, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { getVariables } from "@/lib/variables"
import type { SpotifyPlaylist } from "@/lib/spotify-api"
import { SubgenreSelector } from "./subgenre-selector"
import type { GenreVariable, SimpleVariable, TempoVariable, VocalVariable } from "@/lib/variables"

// Define the props for the modal
interface PlaylistDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  playlist: SpotifyPlaylist | null
  onPlaylistAdded: () => void
}

// Define the form state interface
interface FormState {
  primaryGenre: string
  subgenres: string[]
  moods: string[]
  tempo: string
  vocal: string
  eras: string[]
  language: string
}

export function PlaylistDetailsModal({ isOpen, onClose, playlist, onPlaylistAdded }: PlaylistDetailsModalProps) {
  // State for form data
  const [formState, setFormState] = useState<FormState>({
    primaryGenre: "",
    subgenres: [],
    moods: [],
    tempo: "",
    vocal: "",
    eras: [],
    language: "",
  })

  // State for loading, errors, and success
  const [isPending, setIsPending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [followerCount, setFollowerCount] = useState<number>(0)

  // State for dropdown options
  const [genreOptions, setGenreOptions] = useState<GenreVariable[]>([])
  const [tempoOptions, setTempoOptions] = useState<TempoVariable[]>([])
  const [vocalOptions, setVocalOptions] = useState<VocalVariable[]>([])
  const [moodOptions, setMoodOptions] = useState<SimpleVariable[]>([])
  const [eraOptions, setEraOptions] = useState<SimpleVariable[]>([])
  const [languageOptions, setLanguageOptions] = useState<SimpleVariable[]>([])

  // Load dynamic options from variables
  useEffect(() => {
    let ignore = false

    const loadVariables = async () => {
      setIsLoading(true)
      try {
        // Load all variable categories from the database
        const genres = await getVariables("genres")
        const tempos = await getVariables("tempos")
        const vocals = await getVariables("vocals")
        const moods = await getVariables("moods")
        const eras = await getVariables("eras")
        const languages = await getVariables("languages")

        console.log("Loaded languages:", languages)
        console.log("Loaded genres:", genres)

        // Only update state if the component is still mounted
        if (ignore) return

        // Set the options in state
        setGenreOptions(genres as GenreVariable[])
        setTempoOptions(tempos as TempoVariable[])
        setVocalOptions(vocals as VocalVariable[])
        setMoodOptions(moods as SimpleVariable[])
        setEraOptions(eras as SimpleVariable[])
        setLanguageOptions(languages as SimpleVariable[])

        // Set default values for form state
        if (genres.length > 0) {
          setFormState((prev) => ({ ...prev, primaryGenre: (genres[0] as GenreVariable).id }))
        }

        if (tempos.length > 0) {
          setFormState((prev) => ({ ...prev, tempo: (tempos[0] as TempoVariable).id }))
        }

        if (vocals.length > 0) {
          setFormState((prev) => ({ ...prev, vocal: (vocals[0] as VocalVariable).id }))
        }

        if (languages.length > 0) {
          setFormState((prev) => ({ ...prev, language: (languages[0] as SimpleVariable).id }))
        }
      } catch (err) {
        console.error("Error loading variables:", err)
        if (ignore) return
        setError({ _form: ["Failed to load form options"] })
      } finally {
        if (ignore) return
        setIsLoading(false)
      }
    }

    if (isOpen) {
      loadVariables()
    } else {
      setIsLoading(false)
    }

    return () => {
      ignore = true
    }
  }, [isOpen])

  // Reset state when modal opens or playlist changes
  useEffect(() => {
    if (isOpen && playlist) {
      setError(null)
      setSuccess(null)
      setIsPending(false)
      setImageError(false)

      // Reset form state to defaults with valid values from admin panel variables
      setFormState({
        primaryGenre: genreOptions.length > 0 ? genreOptions[0].id : "",
        subgenres: [],
        moods: [],
        tempo: tempoOptions.length > 0 ? tempoOptions[0].id : "",
        vocal: vocalOptions.length > 0 ? vocalOptions[0].id : "",
        eras: [],
        language: languageOptions.length > 0 ? languageOptions[0].id : "",
      })

      // Ensure follower count is set correctly from the playlist data
      if (playlist.followers && typeof playlist.followers.total === "number") {
        setFollowerCount(playlist.followers.total)
      } else {
        // Fallback to 0 if no follower data is available
        setFollowerCount(0)
      }
    }
  }, [isOpen, playlist, genreOptions, tempoOptions, vocalOptions, languageOptions])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Form validation
    let isValid = true
    const validationErrors: any = {}

    // Validate subgenres
    if (formState.subgenres.length < 3) {
      setError({ subgenres: ["Please select at least 3 subgenres"] })
      return
    }

    // Validate moods
    if (formState.moods.length === 0) {
      validationErrors.moods = ["Please select at least one mood"]
      isValid = false
    }

    // Validate eras
    if (formState.eras.length === 0) {
      validationErrors.eras = ["Please select at least one era"]
      isValid = false
    }

    // If validation fails, show errors and return
    if (!isValid) {
      setError(validationErrors)
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

      // Find the genre option by ID and use its name
      const selectedGenre = genreOptions.find((g) => g.id === formState.primaryGenre)
      if (selectedGenre) {
        formData.append("primaryGenre", selectedGenre.name)
      } else if (genreOptions.length > 0) {
        // Fallback to first genre option if selected one not found
        formData.append("primaryGenre", genreOptions[0].name)
      }

      // Add selected subgenres
      formState.subgenres.forEach((subgenre) => {
        formData.append("subgenres", subgenre)
      })

      // Add selected moods
      formState.moods.forEach((mood) => {
        formData.append("moods", mood)
      })

      // Add tempo
      formData.append("tempos", formState.tempo)

      // Find the vocal option by ID and use its name
      const selectedVocal = vocalOptions.find((v) => v.id === formState.vocal)
      if (selectedVocal) {
        formData.append("vocal", selectedVocal.name)
      } else if (vocalOptions.length > 0) {
        // Fallback to first vocal option if selected one not found
        formData.append("vocal", vocalOptions[0].name)
      } else {
        formData.append("vocal", "Mixed") // Default fallback if no options available
      }

      // Add selected eras
      formState.eras.forEach((era) => {
        formData.append("eras", era)
      })

      // Find the language option by ID and use its name
      const selectedLanguage = languageOptions.find((l) => l.id === formState.language)
      if (selectedLanguage) {
        // Replace the language ID with the exact language name
        formData.append("language", selectedLanguage.name)
      } else if (languageOptions.length > 0) {
        // Fallback to first language option if selected one not found
        formData.append("language", languageOptions[0].name)
      }

      // Extract name from Spotify
      const name = playlist.name || playlist.external_urls?.spotify.split("/").pop() || "My Playlist"

      // Add name to form data
      formData.append("name", name)

      // Add followers count
      formData.append("followers", String(followerCount))

      console.log("Submitting playlist with data:", {
        name,
        followers: followerCount,
        primaryGenre: selectedGenre ? selectedGenre.name : "Unknown",
        subgenres: formState.subgenres,
        moods: formState.moods,
        tempo: formState.tempo,
        vocal: selectedVocal ? selectedVocal.name : "Unknown",
        eras: formState.eras,
        language: selectedLanguage ? selectedLanguage.name : "Unknown",
      })

      // Submit the form
      const result = await addSpotifyPlaylist(null, formData)

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

  // If no playlist is selected, render a simple dialog
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
            <DialogDescription>Please select a playlist to add to your collection.</DialogDescription>
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
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Playlist Details</DialogTitle>
          <DialogDescription>Complete the information below to add this playlist to your collection.</DialogDescription>
        </DialogHeader>

        {/* Playlist header */}
        <div className="flex items-center mb-4">
          <div className="h-16 w-16 flex-shrink-0 bg-muted">{playlistImage}</div>
          <div className="ml-4 flex-1 overflow-hidden">
            <h3 className="font-medium truncate">{playlist.name || "Untitled Playlist"}</h3>
            <p className="text-sm text-muted-foreground truncate">
              By {playlist.owner?.display_name || "Unknown"} • {playlist.tracks?.total || 0} tracks
            </p>
          </div>
        </div>

        {/* Playlist embed */}
        {embedUrl && (
          <div className="w-full h-[80px] bg-black rounded-md overflow-hidden mb-4">
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
          <Input id="name" name="name" value={playlist.name || ""} readOnly className="bg-muted" />
          <p className="text-xs text-muted-foreground">Playlist name is automatically set from Spotify</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Loading form options...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Primary Genre */}
            <div className="space-y-2">
              <Label htmlFor="primaryGenre">
                Primary Genre <span className="text-red-500">*</span>
              </Label>
              <select
                id="primaryGenre"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formState.primaryGenre}
                onChange={(e) => {
                  setFormState((prev) => ({
                    ...prev,
                    primaryGenre: e.target.value,
                    // Reset subgenres when primary genre changes
                    subgenres: [],
                  }))
                }}
                required
              >
                {genreOptions.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
              {error?.primaryGenre && <p className="text-sm text-destructive">{error.primaryGenre[0]}</p>}
            </div>

            {/* Subgenres */}
            <div className="space-y-2">
              <Label htmlFor="subgenres">
                Subgenres <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground ml-1">(select at least 3)</span>
              </Label>
              <SubgenreSelector
                value={formState.subgenres}
                onChange={(value) => setFormState((prev) => ({ ...prev, subgenres: value }))}
                primaryGenre={formState.primaryGenre}
                error={error?.subgenres}
                minRequired={3}
              />
              {error?.subgenres && <p className="text-sm text-destructive">{error.subgenres[0]}</p>}
            </div>

            {/* Moods */}
            <div className="space-y-2">
              <Label>
                Moods <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground ml-1">(select at least one)</span>
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-3">
                {moodOptions.map((mood) => (
                  <div key={mood.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mood-${mood.id}`}
                      checked={formState.moods.includes(mood.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormState((prev) => ({ ...prev, moods: [...prev.moods, mood.id] }))
                        } else {
                          setFormState((prev) => ({ ...prev, moods: prev.moods.filter((m) => m !== mood.id) }))
                        }
                      }}
                    />
                    <label
                      htmlFor={`mood-${mood.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {mood.name}
                    </label>
                  </div>
                ))}
              </div>
              {error?.moods && <p className="text-sm text-destructive">{error.moods[0]}</p>}
            </div>

            {/* Tempo */}
            <div className="space-y-2">
              <Label htmlFor="tempo">
                Tempo <span className="text-red-500">*</span>
              </Label>
              <select
                id="tempo"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formState.tempo}
                onChange={(e) => setFormState((prev) => ({ ...prev, tempo: e.target.value }))}
                required
              >
                {tempoOptions.map((tempo) => (
                  <option key={tempo.id} value={tempo.id}>
                    {tempo.name} ({tempo.bpmRange})
                  </option>
                ))}
              </select>
              {error?.tempo && <p className="text-sm text-destructive">{error.tempo[0]}</p>}
            </div>

            {/* Vocal */}
            <div className="space-y-2">
              <Label htmlFor="vocal">
                Vocal <span className="text-red-500">*</span>
              </Label>
              <select
                id="vocal"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formState.vocal}
                onChange={(e) => setFormState((prev) => ({ ...prev, vocal: e.target.value }))}
                required
              >
                {vocalOptions.map((vocal) => (
                  <option key={vocal.id} value={vocal.id}>
                    {vocal.name}
                  </option>
                ))}
              </select>
              {error?.vocal && <p className="text-sm text-destructive">{error.vocal[0]}</p>}
            </div>

            {/* Eras */}
            <div className="space-y-2">
              <Label>
                Era <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground ml-1">(select at least one)</span>
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border rounded-md p-3">
                {eraOptions.map((era) => (
                  <div key={era.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`era-${era.id}`}
                      checked={formState.eras.includes(era.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormState((prev) => ({ ...prev, eras: [...prev.eras, era.id] }))
                        } else {
                          setFormState((prev) => ({ ...prev, eras: prev.eras.filter((e) => e !== era.id) }))
                        }
                      }}
                    />
                    <label
                      htmlFor={`era-${era.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {era.name}
                    </label>
                  </div>
                ))}
              </div>
              {error?.eras && <p className="text-sm text-destructive">{error.eras[0]}</p>}
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">
                Language <span className="text-red-500">*</span>
              </Label>
              <select
                id="language"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formState.language}
                onChange={(e) => setFormState((prev) => ({ ...prev, language: e.target.value }))}
                required
              >
                {languageOptions.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.name}
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
              <Button type="submit" disabled={isPending || formState.moods.length === 0 || formState.eras.length === 0}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Playlist"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
