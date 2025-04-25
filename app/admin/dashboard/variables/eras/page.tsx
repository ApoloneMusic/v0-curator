import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VariablesManager } from "@/components/admin/variables-manager"
import { VariablesNavigation } from "@/components/admin/variables-navigation"

export default function ErasVariablesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Era Variables</h1>

      <VariablesNavigation currentCategory="eras" />

      <Card>
        <CardHeader>
          <CardTitle>Manage Era Options</CardTitle>
        </CardHeader>
        <CardContent>
          <VariablesManager
            category="eras"
            title="Era Options"
            description="Manage era/decade options for playlists. Users can select multiple eras when creating or editing playlists."
          />
        </CardContent>
      </Card>
    </div>
  )
}
