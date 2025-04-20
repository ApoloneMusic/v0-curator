"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogOut, Settings, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { adminLogout } from "@/lib/actions/admin"

export function AdminHeader() {
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
    await adminLogout()
    router.push("/admin/login")
  }

  return (
    <header className="border-b bg-primary text-primary-foreground">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/admin/dashboard" className="flex items-center">
          <h1 className="text-xl font-bold">
            <span className="text-white">Apolone</span>
            <span className="text-secondary">.</span>
            <span className="ml-2 text-sm bg-white/20 px-2 py-1 rounded-md">Admin Panel</span>
          </h1>
        </Link>

        <div className="flex items-center space-x-4">
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              className="text-white hover:bg-primary-foreground/10"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Database className="h-5 w-5 mr-2" />
              Admin Controls
            </Button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white shadow-lg z-50 animate-in slide-in-from-top-5 fade-in-20">
                <div className="p-1">
                  <Link href="/admin/dashboard/settings">
                    <button className="flex w-full items-center px-2 py-1.5 text-sm rounded-md hover:bg-muted text-left">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </button>
                  </Link>
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
