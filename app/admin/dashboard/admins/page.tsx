import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminUsersTable } from "@/components/admin/admin-users-table"
import { getAllAdminUsers } from "@/lib/actions/admin-users"

export default async function AdminsPage() {
  const { admins = [], success } = await getAllAdminUsers()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Users Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <AdminUsersTable initialAdmins={admins} />
          ) : (
            <div className="p-4 text-center">
              <p className="text-red-500">Failed to load admin users. Please try again later.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
