import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllUsers } from "@/lib/actions/admin-data"
import { UserTable } from "@/components/admin/user-table"

export default async function DatabasePage() {
  const { users, success } = await getAllUsers()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Database Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>User Database</CardTitle>
        </CardHeader>
        <CardContent>{success ? <UserTable initialUsers={users || []} /> : <p>Failed to load users</p>}</CardContent>
      </Card>
    </div>
  )
}
