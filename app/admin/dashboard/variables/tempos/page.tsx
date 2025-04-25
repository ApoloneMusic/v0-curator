import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VariablesManager } from "@/components/admin/variables-manager"
import { VariablesNavigation } from "@/components/admin/variables-navigation"

export default function TemposVariablesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tempo Variables</h1>

      <VariablesNavigation currentCategory="tempos" />

      <Card>
        <CardHeader>
          <CardTitle>Manage Tempo Options</CardTitle>
        </CardHeader>
        <CardContent>
          <VariablesManager
            category="tempos"
            title="Tempo Options"
            description="Manage tempo options with BPM ranges. These options will be available in the playlist creation and editing forms."
            hasAdditionalField
            additionalFieldName="bpmRange"
            additionalFieldLabel="BPM Range"
          />
        </CardContent>
      </Card>
    </div>
  )
}
