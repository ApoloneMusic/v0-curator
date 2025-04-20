"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Music, Plus, AlertCircle } from "lucide-react"
import { searchSpotifyPlaylists } from "@/lib/actions/spotify-actions"
import type { SpotifyPlaylist } from "@/lib/spotify-api"
import { PlaylistDetailsModal } from "./playlist-details-modal"
import { ReloadIcon } from "@radix-ui/react-icons"

// Separate PlaylistCard component for better organization
function PlaylistCard({
  playlist,
  onAddClick,
}: {
  playlist: SpotifyPlaylist
  onAddClick: (playlist: SpotifyPlaylist) => void
}) {
  const [imageError, setImageError] = useState(false)

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
        onError={() => setImageError(true)}
      />
    ) : (
      <Music className="h-8 w-8 m-4 text-muted-foreground" />
    )

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center p-4">
          <div className="h-16 w-16 flex-shrink-0 bg-muted">{playlistImage}</div>
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
            className="ml-2 flex items-center"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onAddClick(playlist)
            }}
            aria-label={`Add ${playlist.name || "playlist"} to your collection`}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Update the component props to accept an onPlaylistAdded callback
interface SpotifySearchProps {
  onPlaylistAdded?: () => void
}

export function SpotifySearch({ onPlaylistAdded }: SpotifySearchProps) {
  // Search state
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SpotifyPlaylist[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Handle search form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate search query
    if (!query.trim()) {
      setError("Please enter a search term")
      return
    }

    // Reset state and start search
    setIsSearching(true)
    setError(null)
    setHasSearched(true)
    setSearchResults([])

    try {
      // Call the search API
      const result = await searchSpotifyPlaylists(query)

      if (result.success && result.playlists) {
        // Filter out invalid playlists
        const validPlaylists = result.playlists.filter(
          (playlist) => playlist && playlist.id && typeof playlist.id === "string",
        )
        setSearchResults(validPlaylists)
      } else {
        setError(result.error || "Failed to search playlists")
      }
    } catch (error: any) {
      setError(`An unexpected error occurred: ${error.message || "Unknown error"}`)
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle clicking the Add button
  const handleAddClick = useCallback((playlist: SpotifyPlaylist) => {
    console.log("Add button clicked for playlist:", playlist.name)

    if (!playlist || !playlist.id) {
      console.error("Invalid playlist data")
      return
    }

    // Set the selected playlist and open the modal
    setSelectedPlaylist(playlist)
    setIsModalOpen(true)

    console.log("Modal state updated:", { isModalOpen: true, selectedPlaylist: playlist.name })
  }, [])

  // Handle closing the modal
  const handleCloseModal = useCallback(() => {
    console.log("Closing modal")
    setIsModalOpen(false)
    // Don't clear selectedPlaylist immediately to avoid UI flicker
    setTimeout(() => setSelectedPlaylist(null), 300)
  }, [])

  // Update the handlePlaylistAdded function to call the callback
  // Handle successful playlist addition
  const handlePlaylistAdded = useCallback(() => {
    console.log("Playlist added successfully")
    setIsModalOpen(false)
    // Could add a success message or refresh the user's playlists here
    setTimeout(() => setSelectedPlaylist(null), 300)
    // Call the onPlaylistAdded callback if provided
    if (onPlaylistAdded) {
      onPlaylistAdded()
    }
  }, [onPlaylistAdded])

  return (
    <div className="space-y-4 relative z-[1]">
      {/* Search form */}
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

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {isSearching && (
        <div className="flex justify-center py-8">
          <div className="flex flex-col items-center">
            <ReloadIcon className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Searching Spotify...</p>
          </div>
        </div>
      )}

      {/* Search results */}
      <div className="space-y-2">
        {!isSearching && searchResults.length > 0 ? (
          searchResults.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} onAddClick={handleAddClick} />
          ))
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

      {/* Debug info - will help us see if the modal should be open */}
      {process.env.NODE_ENV !== "production" && (
        <div className="text-xs text-muted-foreground mt-4 p-2 border rounded">
          <p>Debug: Modal open: {isModalOpen ? "Yes" : "No"}</p>
          <p>Selected playlist: {selectedPlaylist?.name || "None"}</p>
        </div>
      )}

      {/* Playlist details modal - ensure it's always rendered */}
      <PlaylistDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        playlist={selectedPlaylist}
        onPlaylistAdded={handlePlaylistAdded}
      />
    </div>
  )
}
