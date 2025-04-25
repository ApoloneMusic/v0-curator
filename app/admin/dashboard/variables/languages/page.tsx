import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VariablesManager } from "@/components/admin/variables-manager"
import { VariablesNavigation } from "@/components/admin/variables-navigation"

export default function LanguagesVariablesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Language Variables</h1>

      <VariablesNavigation currentCategory="languages" />

      <Card>
        <CardHeader>
          <CardTitle>Manage Language Options</CardTitle>
        </CardHeader>
        <CardContent>
          <VariablesManager
            category="languages"
            title="Language Options"
            description="Manage language options for playlists. These options will be available in the playlist creation and editing forms."
          />
        </CardContent>
      </Card>
    </div>
  )
}
