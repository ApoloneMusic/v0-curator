import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X, Play, Plus, MoreHorizontal } from "lucide-react"

export default function DashboardPage() {
  // Sample data for pitches
  const pitches = [
    {
      id: 1,
      title: "Midnight Dreams",
      artist: "Luna Eclipse",
      submitted: "2 days ago",
      tags: ["Electronic", "Synthwave", "Melancholic", "Mid-tempo"],
      details: ["Instrumental: N", "2020s", "English", "Focus: Vocals"],
      matchPercentage: 87,
      song: {
        title: "Mr. Tambourine Man",
        artist: "Bob Dylan",
      },
      recommendedPlaylists: [
        { name: "Night Drive Synthwave", match: 92 },
        { name: "Electronic Essentials", match: 85 },
        { name: "Chill Electronic", match: 78 },
      ],
    },
    {
      id: 2,
      title: "Ocean Waves",
      artist: "Coastal Sounds",
      submitted: "3 days ago",
      tags: ["Ambient", "Relaxing", "Nature", "Instrumental"],
      details: ["Instrumental: Y", "2020s", "N/A", "Focus: Atmosphere"],
      matchPercentage: 72,
      song: {
        title: "Ocean Breeze",
        artist: "Coastal Sounds",
      },
      recommendedPlaylists: [
        { name: "Ambient Relaxation", match: 95 },
        { name: "Focus & Study", match: 82 },
        { name: "Sleep Sounds", match: 79 },
      ],
    },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pitches</h1>
        <div className="flex space-x-2">
          <Button variant="outline">Filter</Button>
          <Button variant="outline">Sort</Button>
        </div>
      </div>

      <div className="space-y-6">
        {pitches.map((pitch) => (
          <Card key={pitch.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-[120px] h-[120px] bg-muted flex items-center justify-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-md"></div>
                </div>
                <div className="flex-1 p-6">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold">{pitch.title}</h2>
                    <p className="text-muted-foreground">{pitch.artist}</p>
                    <p className="text-sm text-muted-foreground mt-1">Submitted {pitch.submitted}</p>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {pitch.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-muted">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {pitch.details.map((detail) => (
                        <Badge key={detail} variant="outline" className="bg-muted">
                          {detail}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-4 bg-red-700 rounded-md p-3 text-white">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-md mr-3"></div>
                        <div>
                          <p className="font-medium">{pitch.song.title}</p>
                          <p className="text-sm">{pitch.song.artist}</p>
                        </div>
                        <div className="ml-auto flex items-center space-x-2">
                          <Button size="sm" variant="ghost" className="text-white">
                            <Plus className="h-5 w-5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-white">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-white rounded-full">
                            <Play className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs">
                        <span className="bg-red-800 px-2 py-0.5 rounded">Preview</span>
                      </div>
                    </div>

                    <div className="flex mt-4 space-x-4">
                      <Button className="bg-primary hover:bg-primary/90 flex-1">
                        <Check className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive/10 flex-1"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Decline
                      </Button>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Recommended Playlists</h3>
                      <div className="space-y-2">
                        {pitch.recommendedPlaylists.map((playlist) => (
                          <div
                            key={playlist.name}
                            className="flex items-center justify-between p-2 bg-muted rounded-md"
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-200 rounded-md mr-3"></div>
                              <span>{playlist.name}</span>
                            </div>
                            <span className="text-primary font-medium">{playlist.match}% Match</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-[120px] flex flex-col items-center justify-center border-l">
                  <div className="font-bold text-xl">{pitch.matchPercentage}%</div>
                  <div className="text-sm">Match</div>
                  <div className="w-16 h-2 bg-gray-200 rounded-full mt-2">
                    <div className="h-2 bg-primary rounded-full" style={{ width: `${pitch.matchPercentage}%` }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
