"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, ListMusic, Music } from "lucide-react"

const navItems = [
  {
    name: "Pitches",
    href: "/dashboard",
    icon: FileText,
  },
  {
    name: "Placements",
    href: "/dashboard/placements",
    icon: Music,
  },
  {
    name: "Playlists",
    href: "/dashboard/playlists",
    icon: ListMusic,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r bg-white h-full">
      <div className="p-6">
        <h2 className="text-lg font-medium uppercase text-muted-foreground">Main Navigation</h2>
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
