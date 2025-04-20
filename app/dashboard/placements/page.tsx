import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Calendar, DollarSign } from "lucide-react"

export default function PlacementsPage() {
  // Sample data for placements
  const placements = [
    {
      id: 1,
      title: "Commercial Spot",
      artist: "Luna Eclipse",
      song: "Midnight Dreams",
      client: "Nike",
      date: "June 15, 2023",
      fee: "$2,500",
      status: "Completed",
    },
    {
      id: 2,
      title: "TV Show",
      artist: "Coastal Sounds",
      song: "Ocean Waves",
      client: "HBO",
      date: "August 22, 2023",
      fee: "$3,200",
      status: "Pending",
    },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Placements</h1>
        <Button>New Placement</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {placements.map((placement) => (
          <Card key={placement.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>{placement.title}</CardTitle>
                <Badge
                  className={
                    placement.status === "Completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {placement.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Music className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">{placement.song}</span> by {placement.artist}
                  </span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Client:</span> {placement.client}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Date:</span> {placement.date}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-lg font-bold">{placement.fee}</span>
                </div>
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
