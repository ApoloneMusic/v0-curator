"use client"

import { useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

interface SpotifyUser {
  id: string
  display_name: string
  external_urls: {
    spotify: string
  }
  images: Array<{
    url: string
    height: number | null
    width: number | null
  }>
  followers: {
    total: number
  }
}

interface SpotifyUserCardProps {
  user: SpotifyUser
  onViewPlaylists: (userId: string) => void
}

export function SpotifyUserCard({ user, onViewPlaylists }: SpotifyUserCardProps) {
  const [imageError, setImageError] = useState(false)

  // Ensure we have a valid user
  if (!user || !user.id) return null

  // Get the first valid image or use a fallback
  const userImage =
    !imageError && user.images?.length > 0 && user.images[0]?.url ? (
      <img
        src={user.images[0].url || "/placeholder.svg"}
        alt={user.display_name || "User"}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setImageError(true)}
      />
    ) : (
      <User className="h-8 w-8 m-4 text-muted-foreground" />
    )

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center p-4">
          <div className="h-16 w-16 flex-shrink-0 bg-muted rounded-full overflow-hidden">{userImage}</div>
          <div className="ml-4 flex-1 overflow-hidden">
            <h3 className="font-medium truncate">{user.display_name || "Unknown User"}</h3>
            <p className="text-sm text-muted-foreground">{(user.followers?.total || 0).toLocaleString()} followers</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-2 flex items-center"
            onClick={() => onViewPlaylists(user.id)}
            aria-label={`View playlists by ${user.display_name || "user"}`}
          >
            See Playlists
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
