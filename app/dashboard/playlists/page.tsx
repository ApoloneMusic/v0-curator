import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SpotifySearch } from "@/components/playlists/spotify-search"
import { PlaylistManager } from "@/components/playlists/playlist-manager"
import { requireAuth } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { EnvChecker } from "@/components/debug/env-checker"

export default async function PlaylistsPage() {
  // Ensure user is authenticated
  const user = await requireAuth()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Playlists</h1>

      <Tabs defaultValue="search" className="space-y-4">
        <TabsList>
          <TabsTrigger value="search">Search Spotify</TabsTrigger>
          <TabsTrigger value="my-playlists">My Playlists</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search Spotify Playlists</CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorBoundary>
                <SpotifySearch />
                <EnvChecker />
              </ErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-playlists">
          <Card>
            <CardHeader>
              <CardTitle>My Playlists</CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorBoundary>
                <PlaylistManager />
              </ErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
