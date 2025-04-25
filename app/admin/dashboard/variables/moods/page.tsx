import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VariablesManager } from "@/components/admin/variables-manager"
import { VariablesNavigation } from "@/components/admin/variables-navigation"

export default function MoodsVariablesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Mood Variables</h1>

      <VariablesNavigation currentCategory="moods" />

      <Card>
        <CardHeader>
          <CardTitle>Manage Mood Options</CardTitle>
        </CardHeader>
        <CardContent>
          <VariablesManager
            category="moods"
            title="Mood Options"
            description="Manage mood options for playlists. Users can select multiple moods when creating or editing playlists."
          />
        </CardContent>
      </Card>
    </div>
  )
}
