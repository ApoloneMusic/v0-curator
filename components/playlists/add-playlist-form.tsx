"use client"

import { useState } from "react"
import { useActionState } from "react"
import { addPlaylist } from "@/lib/actions/playlist-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"
import { PRIMARY_GENRES, SUBGENRES, MOODS, TEMPOS, VOCALS, ERAS, LANGUAGES } from "@/lib/playlists"

export function AddPlaylistForm() {
  const [isPending, setIsPending] = useState(false)
  const [state, formAction] = useActionState(addPlaylist, { error: {}, success: false })

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    try {
      await formAction(formData)
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="spotifyLink">Spotify Link</Label>
          <Input id="spotifyLink" name="spotifyLink" placeholder="https://open.spotify.com/playlist/..." required />
          {state.error?.spotifyLink && <p className="text-sm text-destructive">{state.error.spotifyLink[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="followers">Followers</Label>
          <Input id="followers" name="followers" type="number" min="0" defaultValue="0" required />
          {state.error?.followers && <p className="text-sm text-destructive">{state.error.followers[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryGenre">Primary Genre</Label>
          <select
            id="primaryGenre"
            name="primaryGenre"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            {PRIMARY_GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          {state.error?.primaryGenre && <p className="text-sm text-destructive">{state.error.primaryGenre[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label>Subgenres (select all that apply)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
            {SUBGENRES.map((subgenre) => (
              <div key={subgenre} className="flex items-center">
                <input type="checkbox" id={`subgenre-${subgenre}`} name="subgenres" value={subgenre} className="mr-2" />
                <label htmlFor={`subgenre-${subgenre}`} className="text-sm">
                  {subgenre}
                </label>
              </div>
            ))}
          </div>
          {state.error?.subgenres && <p className="text-sm text-destructive">{state.error.subgenres[0]}</p>}
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
          {state.error?.moods && <p className="text-sm text-destructive">{state.error.moods[0]}</p>}
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
          {state.error?.tempos && <p className="text-sm text-destructive">{state.error.tempos[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vocal">Vocal</Label>
          <select
            id="vocal"
            name="vocal"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            {VOCALS.map((vocal) => (
              <option key={vocal} value={vocal}>
                {vocal}
              </option>
            ))}
          </select>
          {state.error?.vocal && <p className="text-sm text-destructive">{state.error.vocal[0]}</p>}
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
          {state.error?.eras && <p className="text-sm text-destructive">{state.error.eras[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <select
            id="language"
            name="language"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            {LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
          {state.error?.language && <p className="text-sm text-destructive">{state.error.language[0]}</p>}
        </div>

        {state.error?._form && (
          <Alert variant="destructive">
            <AlertDescription>{state.error._form[0]}</AlertDescription>
          </Alert>
        )}

        {state.success && state.message && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Adding Playlist...
            </>
          ) : (
            "Add Playlist"
          )}
        </Button>
      </div>
    </form>
  )
}
