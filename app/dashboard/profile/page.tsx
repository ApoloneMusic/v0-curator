import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAuth } from "@/lib/auth"
import { ProfileForm } from "@/components/profile/profile-form"
import { CuratorStatsCard } from "@/components/profile/curator-stats-card"
import { CuratorStatusCard } from "@/components/profile/curator-status-card"

export default async function ProfilePage() {
  const user = await requireAuth()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <CuratorStatusCard user={user} />
          <CuratorStatsCard user={user} />
        </div>
      </div>
    </div>
  )
}
