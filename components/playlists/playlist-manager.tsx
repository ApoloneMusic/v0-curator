"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PlaylistCard } from "./playlist-card"
import { getCurrentUserPlaylists, removePlaylist } from "@/lib/actions/playlist-actions"
import type { Playlist } from "@/lib/playlists"
import { EditPlaylistModal } from "./edit-playlist-modal"

export function PlaylistManager() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null)

  // Load playlists
  const loadPlaylists = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getCurrentUserPlaylists()

      if (result.success) {
        setPlaylists(result.playlists)
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

  useEffect(() => {
    loadPlaylists()
  }, [])

  const handleEditPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setIsEditModalOpen(true)
  }

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) {
      return
    }

    try {
      const result = await removePlaylist(playlistId)

      if (result.success) {
        setDeleteMessage(result.message || "Playlist deleted successfully")
        // Remove from local state
        setPlaylists(playlists.filter((p) => p.id !== playlistId))

        // Clear message after a delay
        setTimeout(() => {
          setDeleteMessage(null)
        }, 3000)
      } else {
        setError(result.error || "Failed to delete playlist")
      }
    } catch (error) {
      setError("An unexpected error occurred")
      console.error(error)
    }
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedPlaylist(null)
  }

  const handlePlaylistUpdated = (updatedPlaylist: Playlist) => {
    setIsEditModalOpen(false)
    setSelectedPlaylist(null)

    // Update the playlist in the local state
    setPlaylists(playlists.map((p) => (p.id === updatedPlaylist.id ? updatedPlaylist : p)))
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {deleteMessage && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{deleteMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center p-8">Loading your playlists...</div>
      ) : playlists.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">You haven't added any playlists yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              isOwner={true}
              onEdit={() => handleEditPlaylist(playlist)}
              onDelete={() => handleDeletePlaylist(playlist.id)}
            />
          ))}
        </div>
      )}

      {selectedPlaylist && (
        <EditPlaylistModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          playlist={selectedPlaylist}
          onPlaylistUpdated={handlePlaylistUpdated}
        />
      )}
    </div>
  )
}
