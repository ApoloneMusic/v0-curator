"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { removePlaylist } from "@/lib/actions/playlist-actions"
import { Loader2, Trash } from "lucide-react"
import type { Playlist } from "@/lib/playlists"
import { AddPlaylistForm } from "./add-playlist-form"

interface EditPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  playlist: Playlist
  onPlaylistUpdated: () => void
}

export function EditPlaylistModal({ isOpen, onClose, playlist, onPlaylistUpdated }: EditPlaylistModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this playlist?")) {
      return
    }

    setIsDeleting(true)
    setSuccess(null)

    try {
      const result = await removePlaylist(playlist.id)

      if (result.success) {
        setSuccess(result.message || "Playlist deleted successfully")
        setDeleteMessage(result.message || "Playlist deleted successfully")
        // Remove from local state
        setTimeout(() => {
          onPlaylistUpdated()
        }, 1500)
      } else {
        setSuccess(result.message || "Failed to delete playlist")
      }
    } catch (err: any) {
      setSuccess(err.message || "An unexpected error occurred")
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleFormClose = () => {
    onClose()
  }

  const handleFormUpdate = () => {
    onPlaylistUpdated()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Playlist</DialogTitle>
          <DialogDescription>Update the details for this playlist in your collection.</DialogDescription>
        </DialogHeader>

        <AddPlaylistForm
          playlist={playlist}
          isEditMode={true}
          onPlaylistUpdated={handleFormUpdate}
          onClose={handleFormClose}
        />

        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash className="mr-2 h-4 w-4" />
                Delete Playlist
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
