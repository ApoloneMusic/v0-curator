"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { editPlaylist } from "@/lib/actions/playlist-actions"
import { PRIMARY_GENRES, SUBGENRES, MOODS, TEMPOS, VOCALS, ERAS, LANGUAGES, type Playlist } from "@/lib/playlists"

interface EditPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  playlist: Playlist
  onPlaylistUpdated: (playlist: Playlist) => void
}

export function EditPlaylistModal({ isOpen, onClose, playlist, onPlaylistUpdated }: EditPlaylistModalProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<any>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData(e.currentTarget)

      const result = await editPlaylist(playlist.id, null, formData)

      if (result.success && result.playlist) {
        setSuccess(result.message || "Playlist updated successfully")
        setTimeout(() => {
          onPlaylistUpdated(result.playlist)
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

        {embedUrl && (
          <div className="w-full h-[80px] bg-black rounded-md overflow-hidden">
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
            <Label htmlFor="spotifyLink">Spotify Link</Label>
            <Input id="spotifyLink" name="spotifyLink" defaultValue={playlist.spotifyLink} required />
            {error?.spotifyLink && <p className="text-sm text-destructive">{error.spotifyLink[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="followers">Followers</Label>
            <Input id="followers" name="followers" type="number" min="0" defaultValue={playlist.followers} required />
            {error?.followers && <p className="text-sm text-destructive">{error.followers[0]}</p>}
          </div>

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

          <div className="space-y-2">
            <Label>Subgenres (select all that apply)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {SUBGENRES.map((subgenre) => (
                <div key={subgenre} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`subgenre-${subgenre}`}
                    name="subgenres"
                    value={subgenre}
                    defaultChecked={playlist.subgenres.includes(subgenre)}
                    className="mr-2"
                  />
                  <label htmlFor={`subgenre-${subgenre}`} className="text-sm">
                    {subgenre}
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
                  <input
                    type="checkbox"
                    id={`mood-${mood}`}
                    name="moods"
                    value={mood}
                    defaultChecked={playlist.moods.includes(mood)}
                    className="mr-2"
                  />
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
                  <input
                    type="checkbox"
                    id={`tempo-${tempo}`}
                    name="tempos"
                    value={tempo}
                    defaultChecked={playlist.tempos.includes(tempo)}
                    className="mr-2"
                  />
                  <label htmlFor={`tempo-${tempo}`} className="text-sm">
                    {tempo}
                  </label>
                </div>
              ))}
            </div>
            {error?.tempos && <p className="text-sm text-destructive">{error.tempos[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vocal">Vocal</Label>
            <select
              id="vocal"
              name="vocal"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={playlist.vocal}
              required
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
                  <input
                    type="checkbox"
                    id={`era-${era}`}
                    name="eras"
                    value={era}
                    defaultChecked={playlist.eras.includes(era)}
                    className="mr-2"
                  />
                  <label htmlFor={`era-${era}`} className="text-sm">
                    {era}
                  </label>
                </div>
              ))}
            </div>
            {error?.eras && <p className="text-sm text-destructive">{error.eras[0]}</p>}
          </div>

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

          {error?._form && (
            <Alert variant="destructive">
              <AlertDescription>{error._form[0]}</AlertDescription>
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
                  Updating...
                </>
              ) : (
                "Update Playlist"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
