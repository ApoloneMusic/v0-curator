"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Settings, UserIcon, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { logout } from "@/lib/actions"
import type { User } from "@/lib/types"

export function Header({ user }: { user: User }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    const result = await logout()
    if (result.redirectUrl) {
      router.push(result.redirectUrl)
    }
  }

  const navigateTo = (path: string) => {
    router.push(path)
    setIsDropdownOpen(false)
  }

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!user || !user.name) return "CU"

    return (
      user.name
        .split(" ")
        .filter((part) => part.length > 0)
        .map((part) => part[0] || "")
        .join("")
        .toUpperCase()
        .substring(0, 2) || "CU"
    )
  }

  // Get status badge color
  const getStatusBadgeColor = () => {
    if (!user.status) return "bg-gray-200 text-gray-800"

    switch (user.status) {
      case "verified":
        return "bg-green-100 text-green-800"
      case "unverified":
        return "bg-yellow-100 text-yellow-800"
      case "declined":
        return "bg-red-100 text-red-800"
      case "suspicious":
        return "bg-orange-100 text-orange-800"
      case "blocked":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center">
          <h1 className="text-xl font-bold">
            <span className="text-primary">Curator</span>
            <span className="text-secondary">Dashboard</span>
          </h1>
        </Link>

        <div className="flex items-center space-x-4">
          {user.status && (
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor()}`}>
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </div>
          )}

          <div className="flex items-center rounded-full border border-accent bg-accent/20 px-3 py-1.5">
            <CreditCard className="h-4 w-4 mr-2 text-accent-foreground" />
            <span className="text-accent-foreground font-medium">{user.credits || 0} Credits</span>
          </div>

          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full p-0"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/vibrant-street-market.png" alt={user?.name || "User"} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
            </Button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white shadow-lg z-50 animate-in slide-in-from-top-5 fade-in-20">
                <div className="p-2 border-b">
                  <div className="px-2 py-1.5">
                    <p className="font-medium text-sm">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || "user@example.com"}</p>
                    {user.curatorNick && <p className="text-xs text-muted-foreground mt-1">@{user.curatorNick}</p>}
                  </div>
                </div>
                <div className="p-1">
                  <button
                    className="flex w-full items-center px-2 py-1.5 text-sm rounded-md hover:bg-muted text-left"
                    onClick={() => navigateTo("/dashboard/profile")}
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </button>
                  <button
                    className="flex w-full items-center px-2 py-1.5 text-sm rounded-md hover:bg-muted text-left"
                    onClick={() => navigateTo("/dashboard/settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </button>
                  <div className="h-px my-1 bg-muted"></div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-2 py-1.5 text-sm rounded-md hover:bg-destructive/10 text-destructive text-left"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
