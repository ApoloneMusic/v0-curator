"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export type SearchableDropdownOption = {
  value: string
  label: string
  group?: string
}

interface SearchableDropdownProps {
  options: SearchableDropdownOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  maxItems?: number
}

export function SearchableDropdown({
  options,
  value = [],
  onChange,
  placeholder = "Select items...",
  emptyMessage = "No items found.",
  className,
  disabled = false,
  maxItems,
}: SearchableDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : []

  // Group options by their group property
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, SearchableDropdownOption[]> = {}

    options.forEach((option) => {
      const group = option.group || "Other"
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(option)
    })

    return groups
  }, [options])

  // Filter options based on search query
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery) return groupedOptions

    const filtered: Record<string, SearchableDropdownOption[]> = {}

    Object.entries(groupedOptions).forEach(([group, groupOptions]) => {
      const filteredOptions = groupOptions.filter(
        (option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          option.value.toLowerCase().includes(searchQuery.toLowerCase()),
      )

      if (filteredOptions.length > 0) {
        filtered[group] = filteredOptions
      }
    })

    return filtered
  }, [groupedOptions, searchQuery])

  // Get selected item labels
  const selectedItems = React.useMemo(() => {
    return safeValue.map((v) => {
      const option = options.find((option) => option.value === v)
      return option ? option.label : v
    })
  }, [safeValue, options])

  // Handle item selection
  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      if (safeValue.includes(selectedValue)) {
        onChange(safeValue.filter((v) => v !== selectedValue))
      } else {
        if (maxItems && safeValue.length >= maxItems) {
          onChange([...safeValue.slice(1), selectedValue])
        } else {
          onChange([...safeValue, selectedValue])
        }
      }
    },
    [safeValue, onChange, maxItems],
  )

  // Handle item removal
  const handleRemove = React.useCallback(
    (selectedValue: string) => {
      onChange(safeValue.filter((v) => v !== selectedValue))
    },
    [safeValue, onChange],
  )

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", !safeValue.length && "text-muted-foreground")}
            disabled={disabled}
          >
            {safeValue.length > 0 ? `${safeValue.length} selected` : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="flex-1"
              />
              {searchQuery && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSearchQuery("")}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {Object.entries(filteredGroups).map(([group, groupOptions]) => (
                <React.Fragment key={group}>
                  <CommandGroup heading={group}>
                    {groupOptions.map((option) => (
                      <CommandItem key={option.value} value={option.value} onSelect={handleSelect}>
                        <Check
                          className={cn("mr-2 h-4 w-4", safeValue.includes(option.value) ? "opacity-100" : "opacity-0")}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </React.Fragment>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {safeValue.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedItems.map((item, i) => (
            <Badge key={i} variant="secondary" className="flex items-center gap-1">
              {item}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(safeValue[i])}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
