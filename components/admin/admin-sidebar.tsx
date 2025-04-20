"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Database, Settings, Award, Music, SlidersHorizontal } from "lucide-react"

const navItems = [
  {
    name: "Users",
    href: "/admin/dashboard",
    icon: Users,
  },
  {
    name: "Curators",
    href: "/admin/dashboard/curators",
    icon: Award,
  },
  {
    name: "Playlists",
    href: "/admin/dashboard/playlists",
    icon: Music,
  },
  {
    name: "Variables",
    href: "/admin/dashboard/variables",
    icon: SlidersHorizontal,
  },
  {
    name: "Database",
    href: "/admin/dashboard/database",
    icon: Database,
  },
  {
    name: "Settings",
    href: "/admin/dashboard/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r bg-white h-full">
      <div className="p-6">
        <h2 className="text-lg font-medium uppercase text-muted-foreground">Admin Navigation</h2>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-3 text-base rounded-md ${
                isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
