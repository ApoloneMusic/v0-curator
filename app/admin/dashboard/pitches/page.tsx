import { Suspense } from "react"
import { PitchesTable } from "@/components/admin/pitches-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Pitches Management",
  description: "Manage pitch data for the curator platform",
}

export default function AdminPitchesPage() {
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
            <PitchesTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
