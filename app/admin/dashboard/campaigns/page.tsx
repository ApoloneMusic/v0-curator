import { Suspense } from "react"
import { CampaignsTable } from "@/components/admin/campaigns-table"

export const metadata = {
  title: "Campaigns Management",
  description: "Manage campaign data for the curator platform",
}

export default function CampaignsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Campaigns Management</h1>
      </div>

      <Suspense fallback={<div>Loading campaigns...</div>}>
        <CampaignsTable />
      </Suspense>
    </div>
  )
}
