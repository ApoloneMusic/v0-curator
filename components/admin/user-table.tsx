"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit, Search, ArrowUpDown } from "lucide-react"
import { UserEditor } from "./user-editor"
import { deleteUser } from "@/lib/actions/admin-data"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface User {
  id: string
  name?: string
  email?: string
  role?: string
  curatorNick?: string
  phoneNumber?: string
  status?: string
  credits?: string | number
  accepted?: string | number
  declined?: string | number
  curatorScore?: string | number
  createdAt?: string | number
  updatedAt?: string | number
}

interface UserTableProps {
  initialUsers: User[]
}

export function UserTable({ initialUsers = [] }: UserTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
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

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (user.name && user.name.toString().toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toString().toLowerCase().includes(searchLower)) ||
      (user.curatorNick && user.curatorNick.toString().toLowerCase().includes(searchLower)) ||
      (user.id && user.id.toString().toLowerCase().includes(searchLower))
    )
  })

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortField as keyof User] || ""
    const bValue = b[sortField as keyof User] || ""

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

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    setError(null)
    setSuccess(null)

    try {
      const result = await deleteUser(userId)

      if (result.success) {
        setSuccess(result.message || "User deleted successfully")
        setUsers(users.filter((user) => user.id !== userId))

        // Clear selected user if it was deleted
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(null)
        }
      } else {
        setError(result.error || "Failed to delete user")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    }
  }

  // Handle user update
  const handleUserUpdate = (updatedUser: User) => {
    setUsers(users.map((user) => (user.id === updatedUser.id ? { ...user, ...updatedUser } : user)))
    setSelectedUser(null)
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
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        {selectedUser && (
          <Button variant="outline" onClick={() => setSelectedUser(null)}>
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
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left font-medium text-sm cursor-pointer"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center">
                      Email
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
                  <th className="px-4 py-2 text-left font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-t hover:bg-muted/50 ${selectedUser?.id === user.id ? "bg-muted" : ""}`}
                  >
                    <td className="px-4 py-2">{user.name || "—"}</td>
                    <td className="px-4 py-2">{user.email || "—"}</td>
                    <td className="px-4 py-2">{user.curatorNick || "—"}</td>
                    <td className="px-4 py-2">
                      {user.status ? (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}
                        >
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">{user.credits || 0}</td>
                    <td className="px-4 py-2">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {sortedUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {users.length === 0 ? "No users found in the system" : "No users match your search criteria"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedUser && (
          <div>
            <UserEditor user={selectedUser} onUpdate={handleUserUpdate} />
          </div>
        )}
      </div>
    </div>
  )
}
