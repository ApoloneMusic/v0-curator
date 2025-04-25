"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { getVariables } from "@/lib/variables"
import type { GenreVariable, SubgenreVariable } from "@/lib/variables"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SubgenreSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
  primaryGenre?: string
  error?: string
  minRequired?: number
}

export function SubgenreSelector({ value, onChange, primaryGenre, error, minRequired = 3 }: SubgenreSelectorProps) {
  const [genres, setGenres] = useState<GenreVariable[]>([])
  const [subgenres, setSubgenres] = useState<SubgenreVariable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filteredSubgenres, setFilteredSubgenres] = useState<SubgenreVariable[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  // Load genres and subgenres
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const genresData = (await getVariables("genres")) as GenreVariable[]
        const subgenresData = (await getVariables("subgenres")) as SubgenreVariable[]

        console.log("Loaded genres:", genresData)
        console.log("Loaded subgenres:", subgenresData)

        setGenres(genresData)
        setSubgenres(subgenresData)
      } catch (error) {
        console.error("Error loading genres and subgenres:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter subgenres when primary genre changes or subgenres are loaded
  useEffect(() => {
    if (primaryGenre && subgenres.length > 0) {
      console.log(`Filtering subgenres for genre: ${primaryGenre}`)

      // Filter subgenres by parent genre
      const filtered = subgenres.filter((subgenre) => {
        const match = subgenre.parentGenre === primaryGenre
        return match
      })

      console.log(`Found ${filtered.length} matching subgenres`)

      // If no subgenres match the selected genre, show all subgenres as a fallback
      if (filtered.length === 0) {
        console.log("No matching subgenres found, showing all subgenres as fallback")
        setFilteredSubgenres(subgenres)
      } else {
        setFilteredSubgenres(filtered)
      }
    } else {
      // If no primary genre is selected or subgenres aren't loaded yet, show all
      setFilteredSubgenres(subgenres)
    }
  }, [primaryGenre, subgenres])

  // Validate selection count when value changes
  useEffect(() => {
    if (value.length < minRequired) {
      setValidationError(`Please select at least ${minRequired} subgenres`)
    } else {
      setValidationError(null)
    }
  }, [value, minRequired])

  // Get genre name from ID
  const getGenreName = (genreId: string): string => {
    if (!genreId) return "Other"
    const genre = genres.find((g) => g.id === genreId)
    return genre ? genre.name : genreId
  }

  // Handle checkbox change
  const handleSubgenreChange = (subgenreId: string, checked: boolean) => {
    if (checked) {
      onChange([...value, subgenreId])
    } else {
      onChange(value.filter((id) => id !== subgenreId))
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading subgenres...</div>
  }

  if (subgenres.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          No subgenres available in the system. Please add subgenres in the admin panel.
        </AlertDescription>
      </Alert>
    )
  }

  if (filteredSubgenres.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4 mr-2" />
        <AlertDescription>
          No subgenres found for this genre. Please select a different genre or add subgenres in the admin panel.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.length > 0 ? (
          value.map((subgenreId) => {
            const subgenre = subgenres.find((s) => s.id === subgenreId)
            return (
              <Badge key={subgenreId} variant="secondary">
                {subgenre?.name || subgenreId}
              </Badge>
            )
          })
        ) : (
          <span className="text-sm text-muted-foreground">No subgenres selected</span>
        )}
      </div>

      <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {filteredSubgenres.map((subgenre) => (
            <div key={subgenre.id} className="flex items-center">
              <Checkbox
                id={`subgenre-${subgenre.id}`}
                checked={value.includes(subgenre.id)}
                onCheckedChange={(checked) => handleSubgenreChange(subgenre.id, checked === true)}
                className="mr-2"
              />
              <label htmlFor={`subgenre-${subgenre.id}`} className="text-sm">
                {subgenre.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          Selected: {value.length} / {minRequired} required
        </span>
        {(validationError || error) && <span className="text-xs text-destructive">{validationError || error}</span>}
      </div>
    </div>
  )
}
