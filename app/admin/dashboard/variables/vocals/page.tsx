import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VariablesManager } from "@/components/admin/variables-manager"
import { VariablesNavigation } from "@/components/admin/variables-navigation"

export default function VocalsVariablesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Vocal Variables</h1>

      <VariablesNavigation currentCategory="vocals" />

      <Card>
        <CardHeader>
          <CardTitle>Manage Vocal Options</CardTitle>
        </CardHeader>
        <CardContent>
          <VariablesManager
            category="vocals"
            title="Vocal Options"
            description="Manage vocal type options for playlists. These options will be available in the playlist creation and editing forms."
          />
        </CardContent>
      </Card>
    </div>
  )
}
