import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AddPlaylistForm } from "@/components/playlists/add-playlist-form"
import { PlaylistCard } from "@/components/playlists/playlist-card"
import { getCurrentUserPlaylists } from "@/lib/actions/playlist-actions"
import { requireAuth } from "@/lib/auth"
import { Plus } from "lucide-react"

export default async function MyPlaylistsPage() {
  const user = await requireAuth()
  const { success, playlists = [] } = await getCurrentUserPlaylists()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Playlists</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Playlist
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add New Playlist</CardTitle>
            </CardHeader>
            <CardContent>
              <AddPlaylistForm />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Your Playlists</h2>

          {playlists.length === 0 ? (
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
                  onEdit={() => {}} // We'll implement this later
                  onDelete={() => {}} // We'll implement this later
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
