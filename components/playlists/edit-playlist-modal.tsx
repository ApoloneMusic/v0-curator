"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon, TrashIcon } from "@radix-ui/react-icons"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { editPlaylist, removePlaylist } from "@/lib/actions/playlist-actions"
import { PRIMARY_GENRES, MOODS, ERAS, LANGUAGES, type Playlist } from "@/lib/playlists"
import { SubgenreSelector } from "./subgenre-selector"
import { TempoSelector } from "./tempo-selector"
import { VocalSelector } from "./vocal-selector"

interface EditPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  playlist: Playlist
  onPlaylistUpdated: () => void
}

export function EditPlaylistModal({ isOpen, onClose, playlist, onPlaylistUpdated }: EditPlaylistModalProps) {
  const [isPending, setIsPending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<any>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedSubgenres, setSelectedSubgenres] = useState<string[]>(playlist.subgenres || [])
  const [selectedTempo, setSelectedTempo] = useState(playlist.tempos?.[0] || "medium")
  const [selectedVocal, setSelectedVocal] = useState(playlist.vocal || "mixed")

  // Extract playlist name from Spotify URL or use the stored name
  const getPlaylistName = (playlist: Playlist) => {
    if (playlist.name) return playlist.name

    // Try to extract name from URL path
    try {
      const url = new URL(playlist.spotifyLink)
      const pathParts = url.pathname.split("/")
      const lastPart = pathParts[pathParts.length - 1]
      return lastPart || "Unnamed Playlist"
    } catch {
      // Fall back to the end of the URL
      const urlParts = playlist.spotifyLink.split("/")
      return urlParts[urlParts.length - 1] || "Unnamed Playlist"
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData(e.currentTarget)

      // Add the name field
      const playlistName = (formData.get("name") as string) || getPlaylistName(playlist)
      formData.set("name", playlistName)

      // Add selected subgenres
      formData.delete("subgenres")
      selectedSubgenres.forEach((subgenre) => {
        formData.append("subgenres", subgenre)
      })

      // Add tempo
      formData.delete("tempos")
      formData.append("tempos", selectedTempo)

      // Add vocal
      formData.set("vocal", selectedVocal)

      const result = await editPlaylist(playlist.id, null, formData)

      if (result.success) {
        setSuccess(result.message || "Playlist updated successfully")
        setTimeout(() => {
          onPlaylistUpdated()
        }, 1500)
      } else {
        setError(result.error || { _form: ["Failed to update playlist"] })
      }
    } catch (err) {
      setError({ _form: ["An unexpected error occurred"] })
      console.error(err)
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this playlist?")) {
      return
    }

    setIsDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await removePlaylist(playlist.id)

      if (result.success) {
        setSuccess(result.message || "Playlist deleted successfully")
        setTimeout(() => {
          onPlaylistUpdated()
        }, 1500)
      } else {
        setError({ _form: [result.error || "Failed to delete playlist"] })
      }
    } catch (err) {
      setError({ _form: ["An unexpected error occurred"] })
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  // Extract Spotify playlist ID from URL
  const getPlaylistId = (url: string) => {
    try {
      const parts = url.split("/")
      return parts[parts.length - 1].split("?")[0]
    } catch (e) {
      return null
    }
  }

  const playlistId = getPlaylistId(playlist.spotifyLink)
  const embedUrl = playlistId ? `https://open.spotify.com/embed/playlist/${playlistId}` : null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Playlist</DialogTitle>
        </DialogHeader>

        {/* Playlist header */}
        <div className="flex items-center mb-4">
          <div className="flex-1 overflow-hidden">
            <h3 className="font-medium truncate">{getPlaylistName(playlist)}</h3>
            <p className="text-sm text-muted-foreground truncate">{playlist.followers.toLocaleString()} followers</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Playlist Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Playlist Name</Label>
            <Input id="name" name="name" defaultValue={playlist.name || getPlaylistName(playlist)} required />
            {error?.name && <p className="text-sm text-destructive">{error.name[0]}</p>}
          </div>

          {/* Spotify Link */}
          <div className="space-y-2">
            <Label htmlFor="spotifyLink">Spotify Link</Label>
            <Input id="spotifyLink" name="spotifyLink" defaultValue={playlist.spotifyLink} required />
            {error?.spotifyLink && <p className="text-sm text-destructive">{error.spotifyLink[0]}</p>}
          </div>

          {/* Followers */}
          <div className="space-y-2">
            <Label htmlFor="followers">Followers</Label>
            <Input id="followers" name="followers" type="number" min="0" defaultValue={playlist.followers} required />
            {error?.followers && <p className="text-sm text-destructive">{error.followers[0]}</p>}
          </div>

          {/* Primary Genre */}
          <div className="space-y-2">
            <Label htmlFor="primaryGenre">Primary Genre</Label>
            <select
              id="primaryGenre"
              name="primaryGenre"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={playlist.primaryGenre}
              required
            >
              {PRIMARY_GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            {error?.primaryGenre && <p className="text-sm text-destructive">{error.primaryGenre[0]}</p>}
          </div>

          {/* Subgenres - Using SubgenreSelector component */}
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
          </div>

          {/* Moods */}
          <div className="space-y-2">
            <Label>
              Moods <span className="text-xs text-muted-foreground ml-1">(optional)</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-2">
              {MOODS.map((mood) => (
                <div key={mood} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`mood-${mood}`}
                    name="moods"
                    value={mood}
                    defaultChecked={playlist.moods?.includes(mood)}
                    className="mr-2"
                  />
                  <label htmlFor={`mood-${mood}`} className="text-sm">
                    {mood}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Tempo - Using TempoSelector component */}
          <div className="space-y-2">
            <Label>
              Tempo <span className="text-red-500">*</span>
            </Label>
            <TempoSelector value={selectedTempo} onChange={setSelectedTempo} error={error?.tempos?.[0]} />
            {error?.tempos && <p className="text-sm text-destructive">{error.tempos[0]}</p>}
          </div>

          {/* Vocal - Using VocalSelector component */}
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-2">
              {ERAS.map((era) => (
                <div key={era} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`era-${era}`}
                    name="eras"
                    value={era}
                    defaultChecked={playlist.eras?.includes(era)}
                    className="mr-2"
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
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              name="language"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={playlist.language}
              required
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
          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending || isDeleting}
              className="flex items-center"
            >
              {isDeleting ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete Playlist
                </>
              )}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending || isDeleting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isDeleting || selectedSubgenres.length === 0}>
                {isPending ? (
                  <>
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
