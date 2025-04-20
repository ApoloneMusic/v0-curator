import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserTable } from "@/components/admin/user-table"
import { getAllUsers } from "@/lib/actions/admin-data"

export default async function AdminDashboardPage() {
  const { users = [], success } = await getAllUsers()

  // Ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : []

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{safeUsers.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Verified Curators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {safeUsers.filter((user) => user && user.status === "verified").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {safeUsers.reduce((sum, user) => sum + (Number.parseInt(String(user?.credits || 0), 10) || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <UserTable initialUsers={safeUsers} />
          ) : (
            <div className="p-4 text-center">
              <p className="text-red-500">Failed to load users. Please try again later.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
