"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Define tempo options with BPM ranges
export const TEMPO_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "very_slow", label: "Very Slow (<70 BPM)" },
  { value: "slow", label: "Slow (70-95 BPM)" },
  { value: "medium", label: "Medium (96-120 BPM)" },
  { value: "fast", label: "Fast (121-140 BPM)" },
  { value: "very_fast", label: "Very Fast (>140 BPM)" },
]

interface TempoSelectorProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function TempoSelector({ value, onChange, error }: TempoSelectorProps) {
  const [open, setOpen] = useState(false)

  // Find the selected option
  const selectedOption = TEMPO_OPTIONS.find((option) => option.value === value) || TEMPO_OPTIONS[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", error ? "border-red-500" : "")}
        >
          <span>{selectedOption.label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {TEMPO_OPTIONS.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
