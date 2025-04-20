import type React from "react"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/actions/admin"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is authenticated as admin
  const { isAuthenticated } = await requireAdmin()

  if (!isAuthenticated) {
    redirect("/admin/login")
  }

  return (
    <div className="flex h-screen flex-col">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-muted/30">{children}</main>
      </div>
    </div>
  )
}
