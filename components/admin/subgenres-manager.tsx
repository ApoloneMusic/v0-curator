"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon, PlusCircledIcon, Cross2Icon } from "@radix-ui/react-icons"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getVariablesForCategory,
  updateVariablesForCategory,
  resetVariablesForCategory,
} from "@/lib/actions/variables-actions"
import type { VariableCategory, SubgenreVariable, GenreVariable } from "@/lib/variables"
import { VariablesValidationRules } from "./variables-validation-rules"

interface SubgenresManagerProps {
  category: VariableCategory
  title: string
  description: string
}

export function SubgenresManager({ category, title, description }: SubgenresManagerProps) {
  const [variables, setVariables] = useState<SubgenreVariable[]>([])
  const [genres, setGenres] = useState<GenreVariable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeGenreFilter, setActiveGenreFilter] = useState<string>("all")

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("")

  // New variable form state
  const [newName, setNewName] = useState("")
  const [newParentGenre, setNewParentGenre] = useState("")

  // Load variables on component mount
  useEffect(() => {
    loadVariables()
    loadGenres()
  }, [category])

  // Load variables from the server
  const loadVariables = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getVariablesForCategory(category)

      if (result.success) {
        setVariables(result.variables as SubgenreVariable[])
      } else {
        setError(result.error || `Failed to load ${category}`)
      }
    } catch (err) {
      console.error(`Error loading ${category}:`, err)
      setError(`An unexpected error occurred while loading ${category}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Load genres for parent genre dropdown
  const loadGenres = async () => {
    try {
      const result = await getVariablesForCategory("genres")

      if (result.success) {
        setGenres(result.variables as GenreVariable[])
        // Set default parent genre if available
        if (result.variables.length > 0) {
          setNewParentGenre((result.variables[0] as GenreVariable).id)
        }
      } else {
        console.error("Failed to load genres:", result.error)
      }
    } catch (err) {
      console.error("Error loading genres:", err)
    }
  }

  // Save variables to the server
  const saveVariables = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await updateVariablesForCategory(category, variables)

      if (result.success) {
        setSuccess(result.message || `${title} updated successfully`)
      } else {
        setError(result.error || `Failed to update ${title.toLowerCase()}`)
      }
    } catch (err) {
      console.error(`Error saving ${category}:`, err)
      setError(`An unexpected error occurred while saving ${title.toLowerCase()}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Reset variables to defaults
  const resetVariables = async () => {
    if (!confirm(`Are you sure you want to reset all ${title.toLowerCase()} to defaults? This cannot be undone.`)) {
      return
    }

    setIsResetting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await resetVariablesForCategory(category)

      if (result.success) {
        setVariables(result.variables || [])
        setSuccess(result.message || `${title} reset to defaults`)
      } else {
        setError(result.error || `Failed to reset ${title.toLowerCase()}`)
      }
    } catch (err) {
      console.error(`Error resetting ${category}:`, err)
      setError(`An unexpected error occurred while resetting ${title.toLowerCase()}`)
    } finally {
      setIsResetting(false)
    }
  }

  // Add a new variable
  const addVariable = () => {
    if (!newName.trim()) {
      setError(`${title} name cannot be empty`)
      return
    }

    if (!newParentGenre) {
      setError("Parent genre must be selected")
      return
    }

    // Generate a unique ID based on the name
    const id = newName.toLowerCase().replace(/\s+/g, "_")

    // Check for duplicate IDs
    if (variables.some((v) => v.id === id)) {
      setError(`A ${title.toLowerCase().slice(0, -1)} with this name already exists`)
      return
    }

    // Create the new variable
    const newVariable: SubgenreVariable = {
      id,
      name: newName,
      parentGenre: newParentGenre,
    }

    // Add the new variable
    setVariables([...variables, newVariable])

    // Clear the form
    setNewName("")
    setError(null)
  }

  // Remove a variable
  const removeVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id))
  }

  // Update a variable field
  const updateVariableField = (id: string, field: string, value: string) => {
    setVariables(
      variables.map((v) => {
        if (v.id === id) {
          return { ...v, [field]: value }
        }
        return v
      }),
    )
  }

  // Get genre name by ID
  const getGenreName = (genreId: string): string => {
    const genre = genres.find((g) => g.id === genreId)
    return genre ? genre.name : genreId
  }

  // Filter subgenres by parent genre and search query
  const filteredVariables = variables.filter((variable) => {
    // Filter by parent genre
    if (activeGenreFilter !== "all" && variable.parentGenre !== activeGenreFilter) {
      return false
    }

    // Filter by search query
    if (searchQuery) {
      return (
        variable.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variable.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return true
  })

  // Sort variables by parent genre for better organization
  const sortedVariables = [...filteredVariables].sort((a, b) => {
    // First sort by parent genre
    const aGenreName = getGenreName(a.parentGenre || "")
    const bGenreName = getGenreName(b.parentGenre || "")
    const genreComparison = aGenreName.localeCompare(bGenreName)

    // If same parent genre, sort by name
    return genreComparison !== 0 ? genreComparison : a.name.localeCompare(b.name)
  })

  // Group variables by parent genre for better organization
  const variablesByGenre = sortedVariables.reduce<Record<string, SubgenreVariable[]>>((acc, variable) => {
    const genreId = variable.parentGenre || "uncategorized"
    if (!acc[genreId]) {
      acc[genreId] = []
    }
    acc[genreId].push(variable)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <VariablesValidationRules category={category} />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={resetVariables} disabled={isLoading || isSaving || isResetting}>
            {isResetting ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset to Defaults"
            )}
          </Button>

          <Button onClick={saveVariables} disabled={isLoading || isSaving || isResetting}>
            {isSaving ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      {/* Add new variable form */}
      <div className="border rounded-md p-4 bg-muted/20">
        <h3 className="text-md font-medium mb-4">Add New Subgenre</h3>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label htmlFor="new-name" className="mb-2">
              Name
            </Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Enter ${title.toLowerCase().slice(0, -1)} name`}
            />
          </div>

          <div className="flex-1">
            <Label htmlFor="new-parent-genre" className="mb-2">
              Parent Genre
            </Label>
            <select
              id="new-parent-genre"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={newParentGenre}
              onChange={(e) => setNewParentGenre(e.target.value)}
            >
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={addVariable} className="mb-px">
            <PlusCircledIcon className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search subgenres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={activeGenreFilter}
            onChange={(e) => setActiveGenreFilter(e.target.value)}
          >
            <option value="all">All Genres</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Variables table */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <ReloadIcon className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sortedVariables.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Parent Genre</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVariables.map((variable) => (
                <TableRow key={variable.id}>
                  <TableCell>
                    <Input
                      value={variable.name}
                      onChange={(e) => updateVariableField(variable.id, "name", e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{variable.id}</TableCell>
                  <TableCell>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={variable.parentGenre || ""}
                      onChange={(e) => updateVariableField(variable.id, "parentGenre", e.target.value)}
                    >
                      {genres.map((genre) => (
                        <option key={genre.id} value={genre.id}>
                          {genre.name}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => removeVariable(variable.id)}
                    >
                      <Cross2Icon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">No {title.toLowerCase()} found.</p>
        </div>
      )}
    </div>
  )
}
