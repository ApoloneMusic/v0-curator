import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VariablesManager } from "@/components/admin/variables-manager"
import { VariablesNavigation } from "@/components/admin/variables-navigation"

export default function GenresVariablesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Genre Variables</h1>

      <VariablesNavigation currentCategory="genres" />

      <Card>
        <CardHeader>
          <CardTitle>Manage Genre Options</CardTitle>
        </CardHeader>
        <CardContent>
          <VariablesManager
            category="genres"
            title="Genre Options"
            description="Manage primary genre options for playlists. Each playlist must have one primary genre selected."
          />
        </CardContent>
      </Card>
    </div>
  )
}
