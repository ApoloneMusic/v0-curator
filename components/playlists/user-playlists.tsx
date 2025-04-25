"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Music, Plus, ArrowLeft, AlertCircle, ExternalLink } from "lucide-react"
import { ReloadIcon } from "@radix-ui/react-icons"
import { getSpotifyUserPlaylists } from "@/lib/actions/spotify-actions"
import { PlaylistDetailsModal } from "./playlist-details-modal"
import type { SpotifyPlaylist } from "@/lib/spotify-api"

interface UserPlaylistsProps {
  userId: string
  userName: string
  onBack: () => void
  onPlaylistAdded?: () => void
}

export function UserPlaylists({ userId, userName, onBack, onPlaylistAdded }: UserPlaylistsProps) {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  // Pagination state
  const [offset, setOffset] = useState(0)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Load user's playlists
  useEffect(() => {
    const loadPlaylists = async () => {
      if (offset === 0) {
        setIsLoading(true)
      } else {
        setLoadingMore(true)
      }

      setError(null)

      try {
        const result = await getSpotifyUserPlaylists(userId, limit, offset)

        if (result.success && result.playlists) {
          setPlaylists((prev) => (offset === 0 ? result.playlists : [...prev, ...result.playlists]))
          setTotal(result.total || 0)
          setHasMore(result.next !== null)
        } else {
          setError(result.error || "Failed to load playlists")
        }
      } catch (error: any) {
        setError(`An unexpected error occurred: ${error.message || "Unknown error"}`)
        console.error("Error loading playlists:", error)
      } finally {
        setIsLoading(false)
        setLoadingMore(false)
      }
    }

    loadPlaylists()
  }, [userId, offset, limit])

  // Handle loading more playlists
  const handleLoadMore = () => {
    setLoadingMore(true)
    setOffset((prev) => prev + limit)
  }

  // Handle clicking the Add button
  const handleAddClick = (playlist: SpotifyPlaylist) => {
    if (!playlist || !playlist.id) {
      console.error("Invalid playlist data")
      return
    }

    // Set the selected playlist and open the modal
    setSelectedPlaylist(playlist)
    setIsModalOpen(true)
  }

  // Handle closing the modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedPlaylist(null), 300)
  }

  // Handle successful playlist addition
  const handlePlaylistAdded = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedPlaylist(null), 300)

    // Call the onPlaylistAdded callback if provided
    if (onPlaylistAdded) {
      onPlaylistAdded()
    }
  }

  // Open Spotify profile in new tab
  const openSpotifyProfile = () => {
    window.open(`https://open.spotify.com/user/${userId}`, "_blank")
  }

  // Render playlist card
  const renderPlaylistCard = (playlist: SpotifyPlaylist) => {
    const imageError = imageErrors[playlist.id] || false

    // Ensure we have a valid playlist
    if (!playlist || !playlist.id) return null

    // Get the first valid image or use a fallback
    const playlistImage =
      !imageError && playlist.images?.length > 0 && playlist.images[0]?.url ? (
        <img
          src={playlist.images[0].url || "/placeholder.svg"}
          alt={playlist.name || "Playlist"}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => {
            setImageErrors((prev) => ({ ...prev, [playlist.id]: true }))
          }}
        />
      ) : (
        <Music className="h-8 w-8 m-4 text-muted-foreground" />
      )

    return (
      <Card key={playlist.id} className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center p-4">
            <div className="h-16 w-16 flex-shrink-0 bg-muted">{playlistImage}</div>
            <div className="ml-4 flex-1 overflow-hidden">
              <h3 className="font-medium truncate">{playlist.name || "Untitled Playlist"}</h3>
              <p className="text-sm text-muted-foreground truncate">{playlist.tracks?.total || 0} tracks</p>
              {/* Removed saves count display */}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 flex items-center"
              onClick={() => handleAddClick(playlist)}
              aria-label={`Add ${playlist.name || "playlist"} to your collection`}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Playlist
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Search
        </Button>

        <div className="flex-1">
          <h3 className="text-lg font-medium">Playlists by {userName}</h3>
        </div>

        <Button variant="outline" size="sm" onClick={openSpotifyProfile} className="flex items-center">
          <ExternalLink className="h-4 w-4 mr-1" />
          Open in Spotify
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading state - only show for initial load */}
      {isLoading && offset === 0 && (
        <div className="flex justify-center py-8">
          <div className="flex flex-col items-center">
            <ReloadIcon className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading playlists...</p>
          </div>
        </div>
      )}

      {/* Playlists list */}
      <div className="space-y-2">
        {!isLoading && playlists.length > 0 ? (
          <>
            {playlists.map((playlist) => renderPlaylistCard(playlist))}

            {/* Load more button */}
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore} className="w-full max-w-xs">
                  {loadingMore ? (
                    <>
                      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${playlists.length} of ${total})`
                  )}
                </Button>
              </div>
            )}
          </>
        ) : !isLoading && !error ? (
          <div className="bg-white rounded-lg border p-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 flex items-center justify-center text-muted-foreground mb-4">
              <Music className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-medium mb-2">No playlists found</h3>
            <p className="text-muted-foreground text-center">This user doesn't have any public playlists</p>
          </div>
        ) : null}
      </div>

      {/* Playlist details modal */}
      <PlaylistDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        playlist={selectedPlaylist}
        onPlaylistAdded={handlePlaylistAdded}
      />
    </div>
  )
}
