"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon, DownloadIcon, UploadIcon } from "@radix-ui/react-icons"
import { getAllVariables, importAllVariables } from "@/lib/actions/variables-import-export"
import type { VariableCategory } from "@/lib/variables"

export function VariablesImportExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [jsonData, setJsonData] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await getAllVariables()

      if (result.success) {
        // Format JSON with indentation for better readability
        const formattedJson = JSON.stringify(result.data, null, 2)
        setJsonData(formattedJson)
        setSuccess("Variables exported successfully")
      } else {
        setError(result.error || "Failed to export variables")
      }
    } catch (err) {
      console.error("Error exporting variables:", err)
      setError("An unexpected error occurred while exporting variables")
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    setError(null)
    setSuccess(null)

    try {
      // Parse the JSON data
      let data
      try {
        data = JSON.parse(jsonData)
      } catch (err) {
        setError("Invalid JSON data. Please check the format.")
        setIsImporting(false)
        return
      }

      // Validate the structure
      const categories: VariableCategory[] = ["genres", "subgenres", "moods", "tempos", "vocals", "eras", "languages"]
      const missingCategories = categories.filter((category) => !data[category])

      if (missingCategories.length > 0) {
        setError(`Missing data for categories: ${missingCategories.join(", ")}`)
        setIsImporting(false)
        return
      }

      // Import the data
      const result = await importAllVariables(data)

      if (result.success) {
        setSuccess(result.message || "Variables imported successfully")
      } else {
        setError(result.error || "Failed to import variables")
      }
    } catch (err) {
      console.error("Error importing variables:", err)
      setError("An unexpected error occurred while importing variables")
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownload = () => {
    // Create a blob with the JSON data
    const blob = new Blob([jsonData], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    // Create a link and trigger download
    const a = document.createElement("a")
    a.href = url
    a.download = `curator-variables-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Export Variables</CardTitle>
            <CardDescription>Export all variable data as JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={isExporting} className="mb-4">
              {isExporting ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export All Variables
                </>
              )}
            </Button>

            {jsonData && (
              <div className="space-y-4">
                <Textarea value={jsonData} readOnly className="h-[300px] font-mono text-sm" />
                <Button onClick={handleDownload} variant="outline">
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download JSON File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Variables</CardTitle>
            <CardDescription>Import variable data from JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder="Paste JSON data here"
              className="h-[300px] font-mono text-sm mb-4"
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setJsonData("")}>
              Clear
            </Button>
            <Button onClick={handleImport} disabled={isImporting || !jsonData.trim()}>
              {isImporting ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Import Variables
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
