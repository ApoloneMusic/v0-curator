import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserTable } from "@/components/admin/user-table"
import { getAllUsers } from "@/lib/actions/admin-data"

export default async function AdminDashboardPage() {
  const { users, success } = await getAllUsers()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{users?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Verified Curators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{users?.filter((user) => user.status === "verified").length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {users?.reduce((sum, user) => sum + (Number.parseInt(user.credits) || 0), 0) || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>{success ? <UserTable initialUsers={users || []} /> : <p>Failed to load users</p>}</CardContent>
      </Card>
    </div>
  )
}
