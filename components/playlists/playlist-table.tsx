"use client"

import { useState } from "react"
import { ExternalLink, Pencil, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Playlist } from "@/lib/playlists"
import { EditPlaylistModal } from "./edit-playlist-modal"

interface PlaylistTableProps {
  playlists: Playlist[]
  isOwner?: boolean
  onPlaylistUpdated?: () => void
}

export function PlaylistTable({ playlists, isOwner = false, onPlaylistUpdated }: PlaylistTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Extract playlist name from Spotify URL or use the stored name
  const getPlaylistName = (playlist: Playlist) => {
    if (playlist.name) return playlist.name

    // Try to extract name from URL path
    try {
      const url = new URL(playlist.spotifyLink)
      const pathParts = url.pathname.split("/")
      const lastPart = pathParts[pathParts.length - 1]
      return lastPart || "Unnamed Playlist"
    } catch {
      // Fall back to the end of the URL
      const urlParts = playlist.spotifyLink.split("/")
      return urlParts[urlParts.length - 1] || "Unnamed Playlist"
    }
  }

  // Filter playlists by search query
  const filteredPlaylists = playlists.filter((playlist) => {
    const query = searchQuery.toLowerCase()
    const name = getPlaylistName(playlist).toLowerCase()
    const genre = playlist.primaryGenre.toLowerCase()

    return name.includes(query) || genre.includes(query)
  })

  const handleEditPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedPlaylist(null)
  }

  const handlePlaylistUpdated = () => {
    setIsEditModalOpen(false)
    setSelectedPlaylist(null)

    // Call onPlaylistUpdated to refresh the list
    if (onPlaylistUpdated) {
      onPlaylistUpdated()
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search playlists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Playlist Name</TableHead>
              <TableHead>Primary Genre</TableHead>
              <TableHead className="text-right">Saves</TableHead>
              {isOwner && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlaylists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isOwner ? 4 : 3} className="h-24 text-center">
                  No playlists found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPlaylists.map((playlist) => (
                <TableRow key={playlist.id}>
                  <TableCell className="font-medium">
                    <a
                      href={playlist.spotifyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-primary hover:underline"
                    >
                      {getPlaylistName(playlist)}
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell>{playlist.primaryGenre}</TableCell>
                  <TableCell className="text-right">{playlist.followers.toLocaleString()}</TableCell>
                  {isOwner && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPlaylist(playlist)}
                        className="flex items-center"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
