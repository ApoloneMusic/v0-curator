import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VariablesManager } from "@/components/admin/variables-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function VariablesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Variables Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Manage Form Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="subgenres" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="subgenres">Subgenres</TabsTrigger>
              <TabsTrigger value="tempos">Tempo Options</TabsTrigger>
              <TabsTrigger value="vocals">Vocal Options</TabsTrigger>
            </TabsList>

            <TabsContent value="subgenres">
              <VariablesManager
                category="subgenres"
                title="Subgenres"
                description="Manage subgenres organized by primary genre"
                hasAdditionalField
                additionalFieldName="primaryGenre"
                additionalFieldLabel="Primary Genre"
              />
            </TabsContent>

            <TabsContent value="tempos">
              <VariablesManager
                category="tempos"
                title="Tempo Options"
                description="Manage tempo options with BPM ranges"
                hasAdditionalField
                additionalFieldName="bpmRange"
                additionalFieldLabel="BPM Range"
              />
            </TabsContent>

            <TabsContent value="vocals">
              <VariablesManager category="vocals" title="Vocal Options" description="Manage vocal type options" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
