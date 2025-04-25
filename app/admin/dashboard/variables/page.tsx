import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getVariablesCounts } from "@/lib/actions/variables-stats"
import Link from "next/link"
import { BarChart, Music, Tag, Clock, Mic2, CalendarRange, Globe, ArrowRight } from "lucide-react"

export default async function VariablesPage() {
  const { counts = {} } = await getVariablesCounts()

  const categories = [
    {
      id: "genres",
      name: "Genres",
      description: "Manage primary genre options for playlists",
      count: counts.genres || 0,
      icon: Music,
    },
    {
      id: "subgenres",
      name: "Subgenres",
      description: "Manage subgenre options with parent genre associations",
      count: counts.subgenres || 0,
      icon: Tag,
    },
    {
      id: "moods",
      name: "Moods",
      description: "Manage mood options for playlists",
      count: counts.moods || 0,
      icon: BarChart,
    },
    {
      id: "tempos",
      name: "Tempos",
      description: "Manage tempo options with BPM ranges",
      count: counts.tempos || 0,
      icon: Clock,
    },
    {
      id: "vocals",
      name: "Vocals",
      description: "Manage vocal type options",
      count: counts.vocals || 0,
      icon: Mic2,
    },
    {
      id: "eras",
      name: "Eras",
      description: "Manage era/decade options for playlists",
      count: counts.eras || 0,
      icon: CalendarRange,
    },
    {
      id: "languages",
      name: "Languages",
      description: "Manage language options for playlists",
      count: counts.languages || 0,
      icon: Globe,
    },
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Variables Management</h1>
          <p className="text-muted-foreground">
            Manage variables used throughout the application. Changes made here will be reflected in the playlist
            creation and editing forms.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/dashboard/variables/import-export">Import/Export</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link href={`/admin/dashboard/variables/${category.id}`} key={category.id}>
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center">
                  <category.icon className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
                <ArrowRight className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{category.description}</p>
                <p className="text-sm mt-2 font-medium">
                  {typeof category.count === "number" ? `${category.count} options` : category.count}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
