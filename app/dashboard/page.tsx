import { Suspense } from "react"
import { PitchList } from "@/components/dashboard/pitches/pitch-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Dashboard - Pitches Management",
  description: "Manage pitch data for the curator platform",
}

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pitches Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Pitches</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading pitches...</div>}>
            <PitchList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
