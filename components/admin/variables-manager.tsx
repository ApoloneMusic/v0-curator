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
import type { VariableCategory, Variable } from "@/lib/variables"

interface VariablesManagerProps {
  category: VariableCategory
  title: string
  description: string
  hasAdditionalField?: boolean
  additionalFieldName?: string
  additionalFieldLabel?: string
}

export function VariablesManager({
  category,
  title,
  description,
  hasAdditionalField = false,
  additionalFieldName = "",
  additionalFieldLabel = "",
}: VariablesManagerProps) {
  const [variables, setVariables] = useState<Variable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // New variable form state
  const [newName, setNewName] = useState("")
  const [newAdditionalValue, setNewAdditionalValue] = useState("")

  // Load variables on component mount
  useEffect(() => {
    loadVariables()
  }, [category])

  // Load variables from the server
  const loadVariables = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getVariablesForCategory(category)

      if (result.success) {
        setVariables(result.variables)
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

    if (hasAdditionalField && !newAdditionalValue.trim()) {
      setError(`${additionalFieldLabel} cannot be empty`)
      return
    }

    // Generate a unique ID based on the name
    const id = newName.toLowerCase().replace(/\s+/g, "_")

    // Check for duplicate IDs
    if (variables.some((v) => v.id === id)) {
      setError(`A ${title.toLowerCase().slice(0, -1)} with this name already exists`)
      return
    }

    // Create the new variable based on category
    let newVariable: Variable

    if (category === "subgenres") {
      newVariable = {
        id,
        name: newName,
        primaryGenre: newAdditionalValue,
      }
    } else if (category === "tempos") {
      newVariable = {
        id,
        name: newName,
        bpmRange: newAdditionalValue,
      }
    } else {
      newVariable = {
        id,
        name: newName,
      }
    }

    // Add the new variable
    setVariables([...variables, newVariable])

    // Clear the form
    setNewName("")
    setNewAdditionalValue("")
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

  return (
    <div className="space-y-6">
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
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label htmlFor="new-name">Name</Label>
          <Input
            id="new-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`Enter ${title.toLowerCase().slice(0, -1)} name`}
          />
        </div>

        {hasAdditionalField && (
          <div className="flex-1">
            <Label htmlFor="new-additional">{additionalFieldLabel}</Label>
            <Input
              id="new-additional"
              value={newAdditionalValue}
              onChange={(e) => setNewAdditionalValue(e.target.value)}
              placeholder={`Enter ${additionalFieldLabel.toLowerCase()}`}
            />
          </div>
        )}

        <Button onClick={addVariable} className="mb-px">
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Variables table */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <ReloadIcon className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : variables.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {hasAdditionalField && <TableHead>{additionalFieldLabel}</TableHead>}
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variables.map((variable) => (
                <TableRow key={variable.id}>
                  <TableCell>
                    <Input
                      value={variable.name}
                      onChange={(e) => updateVariableField(variable.id, "name", e.target.value)}
                    />
                  </TableCell>

                  {hasAdditionalField && additionalFieldName && (
                    <TableCell>
                      <Input
                        value={(variable as any)[additionalFieldName] || ""}
                        onChange={(e) => updateVariableField(variable.id, additionalFieldName, e.target.value)}
                      />
                    </TableCell>
                  )}

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
