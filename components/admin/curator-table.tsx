"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Search, ArrowUpDown } from "lucide-react"
import { CuratorEditor } from "./curator-editor"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Curator {
  id: string
  name?: string
  email?: string
  curatorNick?: string
  phoneNumber?: string
  status?: string
  credits?: string | number
  accepted?: string | number
  declined?: string | number
  curatorScore?: string | number
  playlists?: string[]
  createdAt?: string | number
  updatedAt?: string | number
}

interface CuratorTableProps {
  initialCurators: Curator[]
}

export function CuratorTable({ initialCurators = [] }: CuratorTableProps) {
  const [curators, setCurators] = useState<Curator[]>(initialCurators)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCurator, setSelectedCurator] = useState<Curator | null>(null)
  const [sortField, setSortField] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Filter curators based on search term
  const filteredCurators = curators.filter((curator) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (curator.name && curator.name.toString().toLowerCase().includes(searchLower)) ||
      (curator.email && curator.email.toString().toLowerCase().includes(searchLower)) ||
      (curator.curatorNick && curator.curatorNick.toString().toLowerCase().includes(searchLower)) ||
      (curator.id && curator.id.toString().toLowerCase().includes(searchLower))
    )
  })

  // Sort curators
  const sortedCurators = [...filteredCurators].sort((a, b) => {
    const aValue = a[sortField as keyof Curator] || ""
    const bValue = b[sortField as keyof Curator] || ""

    // Convert to strings for comparison
    const aString = aValue.toString().toLowerCase()
    const bString = bValue.toString().toLowerCase()

    if (aString < bString) {
      return sortDirection === "asc" ? -1 : 1
    }
    if (aString > bString) {
      return sortDirection === "asc" ? 1 : -1
    }
    return 0
  })

  // Handle curator update
  const handleCuratorUpdate = (updatedCurator: Curator) => {
    setCurators(
      curators.map((curator) => (curator.id === updatedCurator.id ? { ...curator, ...updatedCurator } : curator)),
    )
    setSelectedCurator(null)
  }

  // Format date
  const formatDate = (timestamp: string | number | undefined) => {
    if (!timestamp) return "—"
    return new Date(Number(timestamp)).toLocaleString()
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800"
      case "unverified":
        return "bg-yellow-100 text-yellow-800"
      case "declined":
        return "bg-red-100 text-red-800"
      case "suspicious":
        return "bg-orange-100 text-orange-800"
      case "blocked":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
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

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search curators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        {selectedCurator && (
          <Button variant="outline" onClick={() => setSelectedCurator(null)}>
            Cancel Editing
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th
                    className="px-4 py-2 text-left font-medium text-sm cursor-pointer"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center">
                      Curator ID
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left font-medium text-sm cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left font-medium text-sm cursor-pointer"
                    onClick={() => handleSort("curatorNick")}
                  >
                    <div className="flex items-center">
                      Nickname
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left font-medium text-sm cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left font-medium text-sm cursor-pointer"
                    onClick={() => handleSort("credits")}
                  >
                    <div className="flex items-center">
                      Credits
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left font-medium text-sm cursor-pointer"
                    onClick={() => handleSort("curatorScore")}
                  >
                    <div className="flex items-center">
                      Score
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCurators.map((curator) => (
                  <tr
                    key={curator.id}
                    className={`border-t hover:bg-muted/50 ${selectedCurator?.id === curator.id ? "bg-muted" : ""}`}
                  >
                    <td className="px-4 py-2 font-mono text-xs">{curator.id}</td>
                    <td className="px-4 py-2">{curator.name || "—"}</td>
                    <td className="px-4 py-2">{curator.curatorNick ? `@${curator.curatorNick}` : "—"}</td>
                    <td className="px-4 py-2">
                      {curator.status ? (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(curator.status)}`}
                        >
                          {curator.status.charAt(0).toUpperCase() + curator.status.slice(1)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">{curator.credits || 0}</td>
                    <td className="px-4 py-2">{curator.curatorScore || 0}</td>
                    <td className="px-4 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setSelectedCurator(curator)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {sortedCurators.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {curators.length === 0
                        ? "No curators found in the system"
                        : "No curators match your search criteria"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedCurator && (
          <div>
            <CuratorEditor curator={selectedCurator} onUpdate={handleCuratorUpdate} />
          </div>
        )}
      </div>
    </div>
  )
}
