"use client"

import { useState, useEffect, useActionState } from "react"
import { addPlaylist, editPlaylist } from "@/lib/actions/playlist-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"
import { getVariables } from "@/lib/variables"
import type { GenreVariable, SimpleVariable, TempoVariable, VocalVariable, SubgenreVariable } from "@/lib/variables"
import { Checkbox } from "@/components/ui/checkbox"
import { SubgenreSelector } from "./subgenre-selector"
import type { Playlist } from "@/lib/playlists"

interface AddPlaylistFormProps {
  playlist?: Playlist
  isEditMode?: boolean
  onPlaylistUpdated?: () => void
  onClose?: () => void
}

export function AddPlaylistForm({ playlist, isEditMode = false, onPlaylistUpdated, onClose }: AddPlaylistFormProps) {
  const [isPending, setIsPending] = useState(false)
  const initialState = { error: {}, success: false }
  const [state, formAction] = useActionState(
    isEditMode && playlist?.id
      ? (formData: FormData) => editPlaylist(playlist.id, initialState, formData)
      : (formData: FormData) => addPlaylist(initialState, formData),
    initialState,
  )

  // State for dropdown options
  const [isLoading, setIsLoading] = useState(true)
  const [genreOptions, setGenreOptions] = useState<GenreVariable[]>([])
  const [tempoOptions, setTempoOptions] = useState<TempoVariable[]>([])
  const [vocalOptions, setVocalOptions] = useState<VocalVariable[]>([])
  const [moodOptions, setMoodOptions] = useState<SimpleVariable[]>([])
  const [eraOptions, setEraOptions] = useState<SimpleVariable[]>([])
  const [languageOptions, setLanguageOptions] = useState<SimpleVariable[]>([])
  const [subgenreOptions, setSubgenreOptions] = useState<SubgenreVariable[]>([])

  // State for selected primary genre (for subgenre filtering)
  const [selectedGenre, setSelectedGenre] = useState<string>(playlist?.primaryGenre || "")
  const [selectedSubgenres, setSelectedSubgenres] = useState<string[]>(playlist?.subgenres || [])

  // Local state for followers
  const [localFollowers, setLocalFollowers] = useState<number>(playlist?.followers || 0)

  // Local state for errors
  const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({})

  // Load variables on component mount
  useEffect(() => {
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
        const subgenres = await getVariables("subgenres")

        console.log("Loaded genres:", genres)
        console.log("Loaded languages:", languages)
        console.log("Loaded subgenres:", subgenres)

        // Set the options in state
        setGenreOptions(genres as GenreVariable[])
        setTempoOptions(tempos as TempoVariable[])
        setVocalOptions(vocals as VocalVariable[])
        setMoodOptions(moods as SimpleVariable[])
        setEraOptions(eras as SimpleVariable[])
        setLanguageOptions(languages as SimpleVariable[])
        setSubgenreOptions(subgenres as SubgenreVariable[])

        // Set default selected genre if available
        if (playlist?.primaryGenre) {
          setSelectedGenre(playlist.primaryGenre)
        } else if (genres.length > 0) {
          const defaultGenre = (genres[0] as GenreVariable).id
          setSelectedGenre(defaultGenre)
          console.log("Setting default genre:", defaultGenre)
        }
      } catch (err) {
        console.error("Error loading variables:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadVariables()
  }, [playlist])

  // Effect to handle success state
  useEffect(() => {
    if (state.success) {
      // Notify parent component after a delay to show success message
      setTimeout(() => {
        onPlaylistUpdated?.()
        onClose?.()
      }, 1500)
    }
  }, [state.success, onPlaylistUpdated, onClose])

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    setFormErrors({})

    try {
      // Client-side validation for subgenres
      if (selectedSubgenres.length < 3) {
        setFormErrors({ subgenres: ["Please select at least 3 subgenres"] })
        setIsPending(false)
        return
      }

      // Create a new FormData instance to ensure we're working with a proper FormData object
      const processedFormData = new FormData()

      // Copy over the original form data
      for (const [key, value] of formData.entries()) {
        processedFormData.append(key, value)
      }

      // Add subgenres to form data
      if (selectedSubgenres.length > 0) {
        // Clear any existing subgenres first to avoid duplicates
        processedFormData.delete("subgenres")

        // Add each selected subgenre
        selectedSubgenres.forEach((subgenre) => {
          processedFormData.append("subgenres", subgenre)
        })
      }

      // Find the vocal option by ID and use its name
      const vocalId = processedFormData.get("vocal") as string
      const selectedVocal = vocalOptions.find((v) => v.id === vocalId)
      if (selectedVocal) {
        // Replace the vocal ID with the vocal name
        processedFormData.delete("vocal")
        processedFormData.append("vocal", selectedVocal.name)
      } else if (vocalOptions.length > 0) {
        // Fallback to first vocal option if selected one not found
        processedFormData.delete("vocal")
        processedFormData.append("vocal", vocalOptions[0].name)
      }

      // Find the language option by ID and use its name
      const languageId = processedFormData.get("language") as string
      const selectedLanguage = languageOptions.find((l) => l.id === languageId)
      if (selectedLanguage) {
        // Replace the language ID with the exact language name
        processedFormData.delete("language")
        processedFormData.append("language", selectedLanguage.name)
      } else if (languageOptions.length > 0) {
        // Fallback to first language option if selected one not found
        processedFormData.delete("language")
        processedFormData.append("language", languageOptions[0].name)
      }

      // Find the genre option by ID and use its name
      const primaryGenreId = processedFormData.get("primaryGenre") as string
      const selectedGenreObj = genreOptions.find((g) => g.id === primaryGenreId)
      if (selectedGenreObj) {
        // Replace the genre ID with the genre name
        processedFormData.delete("primaryGenre")
        processedFormData.append("primaryGenre", selectedGenreObj.name)
      } else if (genreOptions.length > 0) {
        // Fallback to first genre option if selected one not found
        processedFormData.delete("primaryGenre")
        processedFormData.append("primaryGenre", genreOptions[0].name)
      }

      // Add local followers to form data
      processedFormData.delete("followers")
      processedFormData.append("followers", String(localFollowers))

      console.log("Submitting form with vocal:", selectedVocal?.name)
      console.log("Submitting form with language:", selectedLanguage?.name)
      console.log("Submitting form with primary genre:", selectedGenreObj?.name)
      console.log("Submitting form with subgenres:", selectedSubgenres)
      console.log("Form mode:", isEditMode ? "edit" : "add")

      // Submit the form
      await formAction(processedFormData)
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setIsPending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex flex-col items-center">
          <ReloadIcon className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading form options...</p>
        </div>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="spotifyLink">Spotify Link</Label>
          <Input
            id="spotifyLink"
            name="spotifyLink"
            placeholder="https://open.spotify.com/playlist/..."
            defaultValue={playlist?.spotifyLink}
            required
            readOnly={isEditMode}
            className={isEditMode ? "bg-muted" : ""}
          />
          {state.error?.spotifyLink && <p className="text-sm text-destructive">{state.error.spotifyLink[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="followers">Followers</Label>
          <Input
            id="followers"
            name="followers"
            type="number"
            min="0"
            value={localFollowers}
            onChange={(e) => setLocalFollowers(Number(e.target.value))}
            required
          />
          {state.error?.followers && <p className="text-sm text-destructive">{state.error.followers[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryGenre">Primary Genre</Label>
          <select
            id="primaryGenre"
            name="primaryGenre"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedGenre}
            onChange={(e) => {
              const newGenre = e.target.value
              console.log("Selected genre changed to:", newGenre)
              setSelectedGenre(newGenre)

              // Reset subgenres when changing genre
              setSelectedSubgenres([])
            }}
            required
          >
            {genreOptions.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
          {state.error?.primaryGenre && <p className="text-sm text-destructive">{state.error.primaryGenre[0]}</p>}
        </div>

        {/* Subgenres */}
        <div className="space-y-2">
          <Label htmlFor="subgenres">
            Subgenres <span className="text-red-500">*</span>
            <span className="text-xs text-muted-foreground ml-1">(select at least 3)</span>
          </Label>
          <SubgenreSelector
            value={selectedSubgenres}
            onChange={(newSubgenres) => {
              console.log("Selected subgenres updated:", newSubgenres)
              setSelectedSubgenres(newSubgenres)
              // Clear any existing errors when selection changes
              if (formErrors?.subgenres && newSubgenres.length >= 3) {
                setFormErrors((prev) => ({ ...prev, subgenres: undefined }))
              }
            }}
            primaryGenre={selectedGenre}
            error={formErrors?.subgenres?.[0] || state.error?.subgenres?.[0]}
            minRequired={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Moods (select all that apply)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-2">
            {moodOptions.map((mood) => (
              <div key={mood.id} className="flex items-center">
                <Checkbox
                  id={`mood-${mood.id}`}
                  name="moods"
                  value={mood.id}
                  className="mr-2"
                  defaultChecked={playlist?.moods?.includes(mood.id)}
                />
                <label htmlFor={`mood-${mood.id}`} className="text-sm">
                  {mood.name}
                </label>
              </div>
            ))}
          </div>
          {state.error?.moods && <p className="text-sm text-destructive">{state.error.moods[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label>Tempo (select all that apply)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-2">
            {tempoOptions.map((tempo) => (
              <div key={tempo.id} className="flex items-center">
                <Checkbox
                  id={`tempo-${tempo.id}`}
                  name="tempos"
                  value={tempo.id}
                  className="mr-2"
                  defaultChecked={playlist?.tempos?.includes(tempo.id)}
                />
                <label htmlFor={`tempo-${tempo.id}`} className="text-sm">
                  {tempo.name} ({tempo.bpmRange})
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
            defaultValue={getVocalOptionId(playlist?.vocal)}
          >
            {vocalOptions.map((vocal) => (
              <option key={vocal.id} value={vocal.id}>
                {vocal.name}
              </option>
            ))}
          </select>
          {state.error?.vocal && <p className="text-sm text-destructive">{state.error.vocal[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label>Era (select all that apply)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-2">
            {eraOptions.map((era) => (
              <div key={era.id} className="flex items-center">
                <Checkbox
                  id={`era-${era.id}`}
                  name="eras"
                  value={era.id}
                  className="mr-2"
                  defaultChecked={playlist?.eras?.includes(era.id)}
                />
                <label htmlFor={`era-${era.id}`} className="text-sm">
                  {era.name}
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
            defaultValue={getLanguageOptionId(playlist?.language)}
          >
            {languageOptions.map((language) => (
              <option key={language.id} value={language.id}>
                {language.name}
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
              {isEditMode ? "Updating Playlist..." : "Adding Playlist..."}
            </>
          ) : isEditMode ? (
            "Update Playlist"
          ) : (
            "Add Playlist"
          )}
        </Button>
      </div>
    </form>
  )

  // Helper function to find the vocal option ID based on the vocal name
  function getVocalOptionId(vocalName?: string): string {
    if (!vocalName || !vocalOptions.length) return vocalOptions[0]?.id || ""

    const option = vocalOptions.find((v) => v.name.toLowerCase() === vocalName.toLowerCase())
    return option?.id || vocalOptions[0]?.id || ""
  }

  // Helper function to find the language option ID based on the language name
  function getLanguageOptionId(languageName?: string): string {
    if (!languageName || !languageOptions.length) return languageOptions[0]?.id || ""

    const option = languageOptions.find((l) => l.name.toLowerCase() === languageName.toLowerCase())
    return option?.id || languageOptions[0]?.id || ""
  }
}
