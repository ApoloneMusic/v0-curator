"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Search, ArrowUpDown, Plus, ShieldAlert } from "lucide-react"
import { deleteAdminUser } from "@/lib/actions/admin-users"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createAdminUser } from "@/lib/actions/admin-users"
import { ReloadIcon } from "@radix-ui/react-icons"
import { Badge } from "@/components/ui/badge"

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: number
  updatedAt: number
}

interface AdminUsersTableProps {
  initialAdmins: AdminUser[]
}

export function AdminUsersTable({ initialAdmins = [] }: AdminUsersTableProps) {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof AdminUser>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newAdminData, setNewAdminData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Handle sort
  const handleSort = (field: keyof AdminUser) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Filter admins based on search term
  const filteredAdmins = admins.filter((admin) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      admin.name.toLowerCase().includes(searchLower) ||
      admin.email.toLowerCase().includes(searchLower) ||
      admin.id.toLowerCase().includes(searchLower)
    )
  })

  // Sort admins
  const sortedAdmins = [...filteredAdmins].sort((a, b) => {
    // Always put hardcoded admin at the top
    if (a.id === "hardcoded-admin") return -1
    if (b.id === "hardcoded-admin") return 1

    const aValue = a[sortField]
    const bValue = b[sortField]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  // Format date
  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return "N/A"
    return new Date(timestamp).toLocaleString()
  }

  // Handle admin deletion
  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to delete this admin user? This action cannot be undone.")) {
      return
    }

    setError(null)
    setSuccess(null)

    try {
      const result = await deleteAdminUser(adminId)

      if (result.success) {
        setSuccess(result.message || "Admin user deleted successfully")
        setAdmins(admins.filter((admin) => admin.id !== adminId))
      } else {
        setError(result.error || "Failed to delete admin user")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    }
  }

  // Handle creating a new admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsCreating(true)

    // Validate form
    if (newAdminData.password !== newAdminData.confirmPassword) {
      setError("Passwords do not match")
      setIsCreating(false)
      return
    }

    try {
      const result = await createAdminUser({
        name: newAdminData.name,
        email: newAdminData.email,
        password: newAdminData.password,
      })

      if (result.success) {
        setSuccess(result.message || "Admin user created successfully")
        if (result.user) {
          setAdmins([...admins, result.user as AdminUser])
        }
        setIsCreateDialogOpen(false)
        setNewAdminData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        })
      } else {
        setError(result.error || "Failed to create admin user")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsCreating(false)
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
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      </div>

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
                    {sortField === "name" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left font-medium text-sm cursor-pointer"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center">
                    Email
                    {sortField === "email" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left font-medium text-sm cursor-pointer"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center">
                    Created At
                    {sortField === "createdAt" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                  </div>
                </th>
                <th
                  className="px-4 py-2 text-left font-medium text-sm cursor-pointer"
                  onClick={() => handleSort("updatedAt")}
                >
                  <div className="flex items-center">
                    Updated At
                    {sortField === "updatedAt" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                  </div>
                </th>
                <th className="px-4 py-2 text-left font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {admins.length === 0 ? "No admin users found" : "No admin users match your search criteria"}
                  </td>
                </tr>
              ) : (
                sortedAdmins.map((admin) => (
                  <tr key={admin.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-2">
                      <div className="flex items-center">
                        {admin.name}
                        {admin.id === "hardcoded-admin" && (
                          <Badge className="ml-2 bg-primary">
                            <ShieldAlert className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">{admin.email}</td>
                    <td className="px-4 py-2">{formatDate(admin.createdAt)}</td>
                    <td className="px-4 py-2">{formatDate(admin.updatedAt)}</td>
                    <td className="px-4 py-2">
                      {admin.id !== "hardcoded-admin" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteAdmin(admin.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Protected</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Admin User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newAdminData.name}
                onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newAdminData.email}
                onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newAdminData.password}
                onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={newAdminData.confirmPassword}
                onChange={(e) => setNewAdminData({ ...newAdminData, confirmPassword: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Admin"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
