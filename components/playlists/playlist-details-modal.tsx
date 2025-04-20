"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
import type { SpotifyPlaylist } from "@/lib/spotify-api"

interface PlaylistDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  playlist: SpotifyPlaylist | null
  onPlaylistAdded: () => void
}

export function PlaylistDetailsModal({ isOpen, onClose, playlist, onPlaylistAdded }: PlaylistDetailsModalProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<any>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  // Debug logging for modal props
  useEffect(() => {
    console.log("PlaylistDetailsModal props:", { isOpen, hasPlaylist: !!playlist })
  }, [isOpen, playlist])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSuccess(null)
      setIsPending(false)
      setImageError(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    setSuccess(null)

    try {
      if (!playlist || !playlist.id) {
        throw new Error("Invalid playlist data")
      }

      const formData = new FormData(e.currentTarget)
      formData.append("spotifyId", playlist.id)

      console.log("Submitting playlist:", playlist.id)
      const result = await addSpotifyPlaylist(null, formData)

      if (result.success && result.playlist) {
        console.log("Playlist added successfully:", result.playlist)
        setSuccess(result.message || "Playlist added successfully")
        setTimeout(() => {
          onPlaylistAdded()
        }, 1500)
      } else {
        console.error("Failed to add playlist:", result.error)
        setError(result.error || { _form: ["Failed to add playlist"] })
      }
    } catch (err: any) {
      console.error("Error adding playlist:", err)
      setError({ _form: [err.message || "An unexpected error occurred"] })
    } finally {
      setIsPending(false)
    }
  }

  // If no playlist is selected, don't render the modal content
  if (!playlist) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          console.log("Dialog onOpenChange triggered close")
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Playlist Details</DialogTitle>
        </DialogHeader>

        <div className="flex items-center mb-4">
          <div className="h-16 w-16 flex-shrink-0 bg-muted">
            {!imageError &&
            playlist.images &&
            Array.isArray(playlist.images) &&
            playlist.images.length > 0 &&
            playlist.images[0]?.url ? (
              <img
                src={playlist.images[0].url || "/placeholder.svg"}
                alt={playlist.name || "Playlist"}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            ) : (
              <Music className="h-8 w-8 m-4 text-muted-foreground" />
            )}
          </div>
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
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
