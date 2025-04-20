"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PRIMARY_GENRES, SUBGENRES, SUBGENRE_DISPLAY_MAP } from "@/lib/playlists"

// Group subgenres by their primary genre prefix
const groupSubgenresByGenre = () => {
  const groups: Record<string, string[]> = {}

  // Initialize groups for all primary genres
  PRIMARY_GENRES.forEach((genre) => {
    groups[genre] = []
  })

  // Add "Other" category for subgenres that don't match a primary genre
  groups["Other"] = []

  SUBGENRES.forEach((subgenre) => {
    let matched = false

    // Try to match subgenre to a primary genre
    for (const genre of PRIMARY_GENRES) {
      if (
        subgenre.startsWith(genre) ||
        subgenre.includes(`_${genre}`) ||
        SUBGENRE_DISPLAY_MAP[subgenre].includes(genre)
      ) {
        groups[genre].push(subgenre)
        matched = true
        break
      }
    }

    // If no match found, add to "Other"
    if (!matched) {
      groups["Other"].push(subgenre)
    }
  })

  // Remove empty groups
  return Object.fromEntries(Object.entries(groups).filter(([_, subgenres]) => subgenres.length > 0))
}

interface SubgenreSelectorProps {
  selectedSubgenres: string[]
  onChange: (selectedSubgenres: string[]) => void
  error?: string
}

export function SubgenreSelector({ selectedSubgenres, onChange, error }: SubgenreSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const groupedSubgenres = groupSubgenresByGenre()

  // Get display text for the button
  const getButtonText = () => {
    if (selectedSubgenres.length === 0) {
      return "Select subgenres..."
    }

    if (selectedSubgenres.length === 1) {
      return SUBGENRE_DISPLAY_MAP[selectedSubgenres[0]] || selectedSubgenres[0]
    }

    return `${selectedSubgenres.length} subgenres selected`
  }

  // Toggle a subgenre selection
  const toggleSubgenre = (subgenre: string) => {
    if (selectedSubgenres.includes(subgenre)) {
      onChange(selectedSubgenres.filter((s) => s !== subgenre))
    } else {
      onChange([...selectedSubgenres, subgenre])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", error ? "border-red-500" : "")}
        >
          <span className="truncate">{getButtonText()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search subgenres..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
          />
          <CommandList className="max-h-[300px] overflow-auto">
            <CommandEmpty>No subgenres found.</CommandEmpty>
            {Object.entries(groupedSubgenres).map(([genre, subgenres]) => {
              // Filter subgenres based on search query
              const filteredSubgenres = searchQuery
                ? subgenres.filter((s) => SUBGENRE_DISPLAY_MAP[s].toLowerCase().includes(searchQuery.toLowerCase()))
                : subgenres

              if (filteredSubgenres.length === 0) return null

              return (
                <CommandGroup key={genre} heading={genre}>
                  {filteredSubgenres.map((subgenre) => (
                    <CommandItem key={subgenre} value={subgenre} onSelect={() => toggleSubgenre(subgenre)}>
                      <div className="flex items-center">
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                            selectedSubgenres.includes(subgenre)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input",
                          )}
                        >
                          {selectedSubgenres.includes(subgenre) && <Check className="h-3 w-3" />}
                        </div>
                        <span>{SUBGENRE_DISPLAY_MAP[subgenre]}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
