import { getMatchingSettings, getTestCampaigns } from "@/lib/actions/matching-actions"
import { MatchingTable } from "@/components/admin/matching-table"
import { TestMatch } from "@/components/admin/test-match"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata = {
  title: "Matching Algorithm Configuration",
  description: "Configure the matching algorithm settings for campaigns and playlists",
}

export default async function MatchingPage() {
  const matchingSettings = await getMatchingSettings()
  const testCampaigns = await getTestCampaigns()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Matching Algorithm Configuration</h1>
        <p className="text-muted-foreground">
          Configure how campaigns are matched with playlists based on various attributes
        </p>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Matching Rules</TabsTrigger>
          <TabsTrigger value="test">Test Matching</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>About Matching Algorithm</CardTitle>
              <CardDescription>
                Configure how campaigns are matched with playlists. Set required attributes, point values, and field
                mappings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The matching algorithm uses a point-based system to determine the best matches between campaigns and
                playlists. Required attributes must match for a campaign to be considered. Non-required attributes
                contribute their point values to the overall match score.
              </p>
              <div className="mt-4">
                <p className="text-sm font-medium">Legend:</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li className="flex items-center">
                    <span className="text-red-500 mr-1">*</span>
                    <span>Required attribute - must match for consideration</span>
                  </li>
                  <li>Points - Higher values indicate more important attributes</li>
                  <li>Source fields - The field names in campaign and playlist data</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <MatchingTable initialSettings={matchingSettings} />
        </TabsContent>

        <TabsContent value="test">
          <TestMatch campaigns={testCampaigns} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
