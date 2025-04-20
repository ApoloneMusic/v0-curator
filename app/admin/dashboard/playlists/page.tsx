import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlaylistCard } from "@/components/playlists/playlist-card"
import { getAllPlaylists } from "@/lib/playlists"
import { Search } from "lucide-react"

export default async function AdminPlaylistsPage() {
  const playlists = (await getAllPlaylists()) || []

  // Calculate stats safely
  const totalPlaylists = Array.isArray(playlists) ? playlists.length : 0
  const totalFollowers = Array.isArray(playlists)
    ? playlists.reduce((sum, playlist) => sum + (playlist?.followers || 0), 0)
    : 0
  const averageFollowers = totalPlaylists > 0 ? Math.round(totalFollowers / totalPlaylists) : 0

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Playlist Management</h1>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Playlists</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalPlaylists}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Followers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalFollowers.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Followers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{averageFollowers.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Playlists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search playlists..." className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.isArray(playlists) && playlists.length > 0 ? (
          playlists.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} isOwner={false} />)
        ) : (
          <div className="col-span-full text-center p-12">
            <p className="text-muted-foreground">No playlists found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
