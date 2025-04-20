"use client"

import type React from "react"
import { useState, useCallback, useMemo, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Music, Plus, AlertCircle } from "lucide-react"
import { searchSpotifyPlaylists } from "@/lib/actions/spotify-actions"
import type { SpotifyPlaylist } from "@/lib/spotify-api"
import { PlaylistDetailsModal } from "./playlist-details-modal"
import { ReloadIcon } from "@radix-ui/react-icons"

// Create a separate PlaylistCard component to optimize rendering
const PlaylistCard: React.FC<{
  playlist: SpotifyPlaylist
  onAddClick: (playlist: SpotifyPlaylist) => void
}> = ({ playlist, onAddClick }) => {
  const [imageError, setImageError] = useState(false)

  // Ensure playlist is valid
  if (!playlist || !playlist.id) {
    return null
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center p-4">
          <div className="h-16 w-16 flex-shrink-0 bg-muted">
            {!imageError &&
            playlist &&
            playlist.images &&
            Array.isArray(playlist.images) &&
            playlist.images.length > 0 &&
            playlist.images[0]?.url ? (
              <img
                src={playlist.images[0].url || "/placeholder.svg"}
                alt={playlist.name || "Playlist"}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            ) : (
              <Music className="h-8 w-8 m-4 text-muted-foreground" />
            )}
          </div>
          <div className="ml-4 flex-1 overflow-hidden">
            <h3 className="font-medium truncate">{playlist.name || "Untitled Playlist"}</h3>
            <p className="text-sm text-muted-foreground truncate">
              By {playlist.owner?.display_name || "Unknown"} • {playlist.tracks?.total || 0} tracks
            </p>
            <p className="text-sm text-muted-foreground">
              {(playlist.followers?.total || 0).toLocaleString()} followers
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onAddClick(playlist)
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function SpotifySearch() {
  const [query, setQuery] = useState("")
  const [isPending, startTransition] = useTransition()
  const [searchResults, setSearchResults] = useState<SpotifyPlaylist[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Debug logging for modal state
  useEffect(() => {
    console.log("Modal state changed:", { isModalOpen, hasSelectedPlaylist: !!selectedPlaylist })
  }, [isModalOpen, selectedPlaylist])

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!query.trim()) {
        setError("Please enter a search term")
        return
      }

      setIsSearching(true)
      setError(null)
      setHasSearched(true)

      startTransition(() => {
        setSearchResults([])
      })

      try {
        const result = await searchSpotifyPlaylists(query)

        if (result.success && result.playlists) {
          startTransition(() => {
            const validPlaylists = result.playlists.filter(
              (playlist) => playlist && playlist.id && typeof playlist.id === "string",
            )
            setSearchResults(validPlaylists)
          })

          if (result.playlists.length === 0) {
            console.log("No playlists found for query")
          }
        } else {
          setError(result.error || "Failed to search playlists")
          console.error("Search failed:", result.error)
        }
      } catch (error: any) {
        setError(`An unexpected error occurred: ${error.message || "Unknown error"}`)
        console.error("Search error:", error)
      } finally {
        setIsSearching(false)
      }
    },
    [query],
  )

  const handleAddPlaylist = useCallback((playlist: SpotifyPlaylist) => {
    if (!playlist || !playlist.id) {
      console.error("Attempted to add invalid playlist")
      return
    }
    console.log("Add button clicked for playlist:", playlist.name)
    setSelectedPlaylist(playlist)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    console.log("Closing modal")
    setIsModalOpen(false)
    // Add a small delay before clearing the selected playlist to ensure smooth transitions
    setTimeout(() => {
      setSelectedPlaylist(null)
    }, 300)
  }, [])

  const handlePlaylistAdded = useCallback(() => {
    console.log("Playlist added, closing modal")
    setIsModalOpen(false)
    // Add a small delay before clearing the selected playlist to ensure smooth transitions
    setTimeout(() => {
      setSelectedPlaylist(null)
    }, 300)
  }, [])

  // Memoize search results to prevent unnecessary re-renders
  const memoizedSearchResults = useMemo(() => {
    return searchResults.filter((playlist) => playlist && playlist.id)
  }, [searchResults])

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Spotify playlists..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            disabled={isSearching}
          />
        </div>
        <Button type="submit" disabled={isSearching}>
          {isSearching ? (
            <>
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            "Search"
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isSearching && (
        <div className="flex justify-center py-8">
          <div className="flex flex-col items-center">
            <ReloadIcon className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Searching Spotify...</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {!isSearching && memoizedSearchResults.length > 0 ? (
          memoizedSearchResults.map((playlist) =>
            playlist && playlist.id ? (
              <PlaylistCard key={playlist.id} playlist={playlist} onAddClick={handleAddPlaylist} />
            ) : null,
          )
        ) : !isSearching && hasSearched && query ? (
          <div className="bg-white rounded-lg border p-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 flex items-center justify-center text-muted-foreground mb-4">
              <Music className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-medium mb-2">No playlists found</h3>
            <p className="text-muted-foreground text-center">Try a different search term</p>
          </div>
        ) : null}
      </div>

      {/* Always render the modal but control its visibility with isOpen prop */}
      <PlaylistDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        playlist={selectedPlaylist}
        onPlaylistAdded={handlePlaylistAdded}
      />
    </div>
  )
}
