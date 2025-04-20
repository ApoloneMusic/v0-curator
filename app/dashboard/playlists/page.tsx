"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlaylistTable } from "@/components/playlists/playlist-table"
import { SpotifySearch } from "@/components/playlists/spotify-search"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentUserPlaylists } from "@/lib/actions/playlist-actions"
import { ErrorBoundary } from "@/components/error-boundary"
import { Plus } from "lucide-react"
import type { Playlist } from "@/lib/playlists"

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddPlaylist, setShowAddPlaylist] = useState(false)
  const router = useRouter()

  // Load user's playlists
  const loadPlaylists = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getCurrentUserPlaylists()

      if (result.success) {
        setPlaylists(result.playlists || [])
      } else {
        setError(result.error || "Failed to load playlists")
      }
    } catch (error) {
      setError("An unexpected error occurred")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load playlists on component mount
  useEffect(() => {
    loadPlaylists()
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Playlist Management</h1>
        <Button onClick={() => setShowAddPlaylist(!showAddPlaylist)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Playlist
        </Button>
      </div>

      {/* Show errors if any */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add playlist section */}
      {showAddPlaylist && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Playlist</CardTitle>
            <CardDescription>Search Spotify and add playlists to your collection</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <SpotifySearch
                onPlaylistAdded={() => {
                  loadPlaylists()
                  setShowAddPlaylist(false)
                }}
              />
            </ErrorBoundary>
          </CardContent>
        </Card>
      )}

      {/* Main playlists table */}
      <Card>
        <CardHeader>
          <CardTitle>My Playlists</CardTitle>
          <CardDescription>Manage your collection of playlists</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorBoundary>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : playlists.length > 0 ? (
              <PlaylistTable playlists={playlists} isOwner={true} onPlaylistUpdated={loadPlaylists} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You haven't added any playlists yet</p>
                <Button onClick={() => setShowAddPlaylist(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Playlist
                </Button>
              </div>
            )}
          </ErrorBoundary>
        </CardContent>
      </Card>
    </div>
  )
}
