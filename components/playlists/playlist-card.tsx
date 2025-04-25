"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, ExternalLink } from "lucide-react"
import type { Playlist } from "@/lib/playlists"

interface PlaylistCardProps {
  playlist: Playlist
  onEdit?: () => void
  onDelete?: () => void
  isOwner: boolean
}

export function PlaylistCard({ playlist, onEdit, onDelete, isOwner }: PlaylistCardProps) {
  // Extract Spotify playlist ID from URL
  const getPlaylistId = (url: string) => {
    try {
      const parts = url.split("/")
      return parts[parts.length - 1].split("?")[0]
    } catch (e) {
      return null
    }
  }

  const playlistId = getPlaylistId(playlist.spotifyLink)
  const embedUrl = playlistId ? `https://open.spotify.com/embed/playlist/${playlistId}` : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg truncate">{playlist.spotifyLink.split("/").pop()}</CardTitle>
          <Badge className="bg-primary">{playlist.followers.toLocaleString()} followers</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {embedUrl && (
          <div className="w-full h-[80px] bg-black rounded-md overflow-hidden">
            <iframe
              src={embedUrl}
              width="100%"
              height="80"
              frameBorder="0"
              allow="encrypted-media"
              title="Spotify Playlist"
            ></iframe>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="bg-muted">
              {playlist.primaryGenre}
            </Badge>
            <Badge variant="outline" className="bg-muted">
              {playlist.vocal}
            </Badge>
            <Badge variant="outline" className="bg-muted">
              {playlist.language}
            </Badge>
          </div>

          {playlist.moods.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Moods:</p>
              <div className="flex flex-wrap gap-1">
                {playlist.moods.map((mood) => (
                  <Badge key={mood} variant="outline" className="text-xs">
                    {mood}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {playlist.tempos.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tempos:</p>
              <div className="flex flex-wrap gap-1">
                {playlist.tempos.map((tempo) => (
                  <Badge key={tempo} variant="outline" className="text-xs">
                    {tempo}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {playlist.eras.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Eras:</p>
              <div className="flex flex-wrap gap-1">
                {playlist.eras.map((era) => (
                  <Badge key={era} variant="outline" className="text-xs">
                    {era}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2">
          <a
            href={playlist.spotifyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open in Spotify
          </a>

          {isOwner && (
            <div className="flex space-x-2">
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
