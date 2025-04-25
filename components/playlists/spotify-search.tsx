"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, User, AlertCircle, Info } from "lucide-react"
import { searchSpotifyUsers, getSpotifyUserProfile } from "@/lib/actions/spotify-actions"
import { ReloadIcon } from "@radix-ui/react-icons"
import { SpotifyUserCard } from "./spotify-user-card"
import { UserPlaylists } from "./user-playlists"
import { SpotifyProfileUrlInput } from "./spotify-profile-url-input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define the SpotifyUser type
interface SpotifyUser {
  id: string
  display_name: string
  external_urls: {
    spotify: string
  }
  images: {
    url: string
    height: number | null
    width: number | null
  }[]
  followers: {
    total: number
  }
}

// Update the component props to accept an onPlaylistAdded callback
interface SpotifySearchProps {
  onPlaylistAdded?: () => void
}

export function SpotifySearch({ onPlaylistAdded }: SpotifySearchProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<string>("search")

  // Search state
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SpotifyUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTips, setSearchTips] = useState<string | null>(null)

  // User playlists state
  const [selectedUser, setSelectedUser] = useState<SpotifyUser | null>(null)
  const [showUserPlaylists, setShowUserPlaylists] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  // Pagination state
  const [offset, setOffset] = useState(0)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Reset search state when query changes
  useEffect(() => {
    setSearchTips(null)
    setError(null)
  }, [query])

  // Handle search form submission
  const handleSearch = async (e: React.FormEvent, newOffset = 0) => {
    e.preventDefault()

    // Validate search query
    if (!query.trim()) {
      setError("Please enter a search term")
      return
    }

    // Reset state and start search
    setIsSearching(true)
    setError(null)
    setSearchTips(null)
    setHasSearched(true)

    // Only clear results if this is a new search
    if (newOffset === 0) {
      setSearchResults([])
    }

    setOffset(newOffset)
    setShowUserPlaylists(false)
    setSelectedUser(null)

    try {
      // Call the search API
      const result = await searchSpotifyUsers(query, limit, newOffset)

      if (result.success && result.users) {
        // If this is a new search (offset 0), replace results
        // Otherwise append to existing results
        if (newOffset === 0) {
          setSearchResults(result.users)
        } else {
          setSearchResults((prev) => [...prev, ...result.users])
        }

        setTotal(result.total || 0)
        setHasMore(result.next !== null)

        // Show search tips if no results found
        if (result.users.length === 0 && newOffset === 0) {
          setSearchTips(`
            Try these search tips:
            • Use the exact Spotify username
            • Try a Spotify profile URL (spotify:user:username)
            • Search for a playlist name by the user
            • Try different spellings or variations
          `)
        }
      } else {
        setError(result.error || "Failed to search users")
      }
    } catch (error: any) {
      setError(`An unexpected error occurred: ${error.message || "Unknown error"}`)
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle loading more results
  const handleLoadMore = (e: React.MouseEvent) => {
    e.preventDefault()
    handleSearch(e as unknown as React.FormEvent, offset + limit)
  }

  // Handle direct profile URL submission
  const handleProfileSubmit = async (userId: string) => {
    setIsLoadingProfile(true)
    setError(null)
    setSearchTips(null)
    setShowUserPlaylists(false)
    setSelectedUser(null)

    try {
      // Get user profile
      const result = await getSpotifyUserProfile(userId)

      if (result.success && result.profile) {
        // Set the selected user and show playlists
        setSelectedUser(result.profile)
        setShowUserPlaylists(true)
        setActiveTab("url") // Ensure we stay on the URL tab
      } else {
        setError(result.error || `Could not find Spotify user with ID: ${userId}`)
      }
    } catch (error: any) {
      setError(`An unexpected error occurred: ${error.message || "Unknown error"}`)
      console.error("Profile error:", error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Handle viewing a user's playlists
  const handleViewPlaylists = useCallback(
    (userId: string) => {
      const user = searchResults.find((user) => user.id === userId)
      if (user) {
        setSelectedUser(user)
        setShowUserPlaylists(true)
      }
    },
    [searchResults],
  )

  // Handle going back to search results
  const handleBackToSearch = useCallback(() => {
    setShowUserPlaylists(false)
    setSelectedUser(null)
  }, [])

  // Handle playlist added callback
  const handlePlaylistAdded = useCallback(() => {
    // Call the onPlaylistAdded callback if provided
    if (onPlaylistAdded) {
      onPlaylistAdded()
    }
  }, [onPlaylistAdded])

  return (
    <div className="space-y-4 relative z-[1]">
      {/* Only show tabs if not viewing user playlists */}
      {!showUserPlaylists ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search Users</TabsTrigger>
            <TabsTrigger value="url">Profile URL</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4 space-y-4">
            {/* Search form */}
            <form onSubmit={(e) => handleSearch(e)} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search Spotify users..."
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

            {/* Search tips */}
            {searchTips && (
              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 mr-2 text-blue-500" />
                <AlertDescription className="whitespace-pre-line text-blue-700">{searchTips}</AlertDescription>
              </Alert>
            )}

            {/* Loading state */}
            {isSearching && offset === 0 && (
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
                <>
                  {searchResults.map((user) => (
                    <SpotifyUserCard key={user.id} user={user} onViewPlaylists={handleViewPlaylists} />
                  ))}

                  {/* Load more button */}
                  {hasMore && (
                    <div className="flex justify-center mt-4">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isSearching}
                        className="w-full max-w-xs"
                      >
                        {isSearching ? (
                          <>
                            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More Results"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : !isSearching && hasSearched && query ? (
                <div className="bg-white rounded-lg border p-12 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 flex items-center justify-center text-muted-foreground mb-4">
                    <User className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No users found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Try a different search term or check the spelling
                  </p>
                  <div className="text-sm text-left space-y-1 text-muted-foreground">
                    <p>• Try the exact Spotify username</p>
                    <p>• Try a Spotify profile URL</p>
                    <p>• Search for a playlist name by the user</p>
                    <p>• Try different spellings or variations</p>
                  </div>
                </div>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-4 space-y-4">
            {/* Profile URL input */}
            <SpotifyProfileUrlInput onProfileSubmit={handleProfileSubmit} isLoading={isLoadingProfile} />

            {/* Error display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      ) : null}

      {/* User playlists view */}
      {showUserPlaylists && selectedUser && (
        <UserPlaylists
          userId={selectedUser.id}
          userName={selectedUser.display_name}
          onBack={handleBackToSearch}
          onPlaylistAdded={handlePlaylistAdded}
        />
      )}
    </div>
  )
}
