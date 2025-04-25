"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, Settings, ListMusic, Tag, Megaphone, Send, ShieldAlert, Sliders } from "lucide-react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: BarChart3,
  },
  {
    title: "Admins",
    href: "/admin/dashboard/admins",
    icon: ShieldAlert,
  },
  {
    title: "Playlists",
    href: "/admin/dashboard/playlists",
    icon: ListMusic,
  },
  {
    title: "Campaigns",
    href: "/admin/dashboard/campaigns",
    icon: Megaphone,
  },
  {
    title: "Pitches",
    href: "/admin/dashboard/pitches",
    icon: Send,
  },
  {
    title: "Matching",
    href: "/admin/dashboard/matching",
    icon: Sliders,
  },
  {
    title: "Variables",
    href: "/admin/dashboard/variables",
    icon: Tag,
    children: [
      { title: "Genres", href: "/admin/dashboard/variables/genres" },
      { title: "Subgenres", href: "/admin/dashboard/variables/subgenres" },
      { title: "Moods", href: "/admin/dashboard/variables/moods" },
      { title: "Tempos", href: "/admin/dashboard/variables/tempos" },
      { title: "Vocals", href: "/admin/dashboard/variables/vocals" },
      { title: "Eras", href: "/admin/dashboard/variables/eras" },
      { title: "Languages", href: "/admin/dashboard/variables/languages" },
    ],
  },
  {
    title: "Settings",
    href: "/admin/dashboard/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r bg-white h-full">
      <div className="p-6">
        <h2 className="text-lg font-medium">Admin Panel</h2>
      </div>
      <div className="px-3 py-2">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href || (item.children && item.children.some((child) => pathname === child.href))
            const isVariablesSection = item.title === "Variables" && pathname.startsWith("/admin/dashboard/variables")

            return (
              <div key={item.href} className="space-y-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive || isVariablesSection
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>

                {/* Render children for Variables section if active */}
                {item.children && isVariablesSection && (
                  <div className="ml-7 mt-1 space-y-1 border-l pl-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center rounded-lg px-3 py-1.5 text-xs transition-colors",
                          pathname === child.href
                            ? "bg-muted text-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
