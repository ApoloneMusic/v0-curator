import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Matching Algorithm Configuration</h1>
        <p className="text-muted-foreground">
          Configure how campaigns are matched with playlists based on various attributes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matching Algorithm Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
