"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Link, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SpotifyProfileUrlInputProps {
  onProfileSubmit: (userId: string) => void
  isLoading?: boolean
}

export function SpotifyProfileUrlInput({ onProfileSubmit, isLoading = false }: SpotifyProfileUrlInputProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Extract Spotify user ID from URL
  const extractUserId = (inputUrl: string): string | null => {
    try {
      // Clean up the URL
      const trimmedUrl = inputUrl.trim()

      // Check for Spotify URI format: spotify:user:username
      const uriMatch = trimmedUrl.match(/spotify:user:([a-zA-Z0-9_-]+)/)
      if (uriMatch) {
        return uriMatch[1]
      }

      // Check for Spotify URL format: https://open.spotify.com/user/username
      const urlMatch = trimmedUrl.match(/spotify\.com\/user\/([a-zA-Z0-9_-]+)/)
      if (urlMatch) {
        // Remove any query parameters
        return urlMatch[1].split("?")[0]
      }

      // If it's just a username without URL/URI format, return as is
      if (/^[a-zA-Z0-9_-]+$/.test(trimmedUrl)) {
        return trimmedUrl
      }

      return null
    } catch (error) {
      console.error("Error extracting user ID:", error)
      return null
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError("Please enter a Spotify profile URL")
      return
    }

    const userId = extractUserId(url)
    if (!userId) {
      setError("Invalid Spotify profile URL. Please enter a valid URL like: https://open.spotify.com/user/username")
      return
    }

    onProfileSubmit(userId)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Link className="h-5 w-5 mr-2" />
          Spotify Profile URL
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="https://open.spotify.com/user/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load Playlists"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a Spotify profile URL or user ID to load their playlists
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
