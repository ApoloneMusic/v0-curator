import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SubgenresManager } from "@/components/admin/subgenres-manager"
import { VariablesNavigation } from "@/components/admin/variables-navigation"

export default function SubgenresVariablesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Subgenre Variables</h1>

      <VariablesNavigation currentCategory="subgenres" />

      <Card>
        <CardHeader>
          <CardTitle>Manage Subgenre Options</CardTitle>
        </CardHeader>
        <CardContent>
          <SubgenresManager
            category="subgenres"
            title="Subgenre Options"
            description="Manage subgenre options for playlists. Each subgenre is associated with a parent genre."
          />
        </CardContent>
      </Card>
    </div>
  )
}
