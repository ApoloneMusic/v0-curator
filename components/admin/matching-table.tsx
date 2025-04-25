"use client"

import { Badge } from "@/components/ui/badge"

import { SelectItem } from "@/components/ui/select"

import { SelectContent } from "@/components/ui/select"

import { SelectValue } from "@/components/ui/select"

import { SelectTrigger } from "@/components/ui/select"

import { Select } from "@/components/ui/select"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SearchableDropdown } from "@/components/ui/searchable-dropdown"
import {
  type MatchingAttribute,
  type MatchingSettings,
  type TierGapAttribute,
  saveMatchingSettings,
  getCampaignFields,
  getPlaylistFields,
  getTestCampaigns,
  runTestMatch,
} from "@/lib/actions/matching-actions"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface MatchingTableProps {
  initialSettings: MatchingSettings
}

export function MatchingTable({ initialSettings }: MatchingTableProps) {
  const [settings, setSettings] = useState<MatchingSettings>(initialSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [campaignFields, setCampaignFields] = useState<string[]>([])
  const [playlistFields, setPlaylistFields] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [testCampaigns, setTestCampaigns] = useState<{ id: number; name: string }[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("")
  const [testResults, setTestResults] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)

  useEffect(() => {
    const loadFieldOptions = async () => {
      try {
        const [campaignFieldsData, playlistFieldsData, testCampaignsData] = await Promise.all([
          getCampaignFields(),
          getPlaylistFields(),
          getTestCampaigns(),
        ])

        setCampaignFields(campaignFieldsData)
        setPlaylistFields(playlistFieldsData)
        setTestCampaigns(testCampaignsData)
      } catch (error) {
        console.error("Error loading field options:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFieldOptions()
  }, [])

  const handleRequiredChange = (index: number, required: boolean) => {
    const newAttributes = [...settings.attributes]
    newAttributes[index] = { ...newAttributes[index], required }
    setSettings({ ...settings, attributes: newAttributes })
  }

  const handlePointsChange = (index: number, points: string) => {
    const pointsValue = Number.parseInt(points, 10) || 0
    const newAttributes = [...settings.attributes]
    newAttributes[index] = { ...newAttributes[index], points: pointsValue }
    setSettings({ ...settings, attributes: newAttributes })
  }

  const handleSourceCampaignChange = (index: number, values: string[]) => {
    if (values.length > 0) {
      const newAttributes = [...settings.attributes]
      newAttributes[index] = { ...newAttributes[index], sourceCampaign: values[0] }
      setSettings({ ...settings, attributes: newAttributes })
    }
  }

  const handleSourcePlaylistChange = (index: number, values: string[]) => {
    if (values.length > 0) {
      const newAttributes = [...settings.attributes]
      newAttributes[index] = { ...newAttributes[index], sourcePlaylist: values[0] }
      setSettings({ ...settings, attributes: newAttributes })
    }
  }

  const handleMaxDifferenceChange = (index: number, value: string) => {
    const maxDifference = Number.parseInt(value, 10) || 0
    const newAttributes = [...settings.attributes]
    const attribute = newAttributes[index] as TierGapAttribute
    if ("maxDifference" in attribute) {
      attribute.maxDifference = maxDifference
      setSettings({ ...settings, attributes: newAttributes })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus(null)

    try {
      const result = await saveMatchingSettings(settings)
      setSaveStatus(result)
    } catch (error) {
      setSaveStatus({ success: false, message: "An error occurred while saving" })
    } finally {
      setIsSaving(false)
    }
  }

  const isTierGapAttribute = (attribute: MatchingAttribute | TierGapAttribute): attribute is TierGapAttribute => {
    return attribute.id === "tier_gap"
  }

  const handleRunTest = async () => {
    if (!selectedCampaignId) {
      setTestError("Please select a campaign")
      return
    }

    setTestLoading(true)
    setTestError(null)
    setTestResults(null)

    try {
      const response = await runTestMatch(Number(selectedCampaignId), settings)

      if (response.success && response.results) {
        setTestResults(response.results)
      } else {
        setTestError(response.message)
      }
    } catch (err) {
      setTestError("An error occurred while running the test")
      console.error(err)
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matching Algorithm Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Attribute</th>
                    <th className="text-left py-3 px-4">Required</th>
                    <th className="text-left py-3 px-4">Points</th>
                    {settings.attributes.some((attr) => isTierGapAttribute(attr)) && (
                      <th className="text-left py-3 px-4">Max Difference</th>
                    )}
                    <th className="text-left py-3 px-4">Source Campaign</th>
                    <th className="text-left py-3 px-4">Source Playlist</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Primary Matching Attributes */}
                  <tr className="bg-muted/30">
                    <td colSpan={6} className="py-2 px-4 font-medium">
                      Primary Matching Attributes
                    </td>
                  </tr>
                  {settings.attributes.slice(0, 4).map((attribute, index) => (
                    <tr key={attribute.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {attribute.name}
                          {attribute.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Switch
                          checked={attribute.required}
                          onCheckedChange={(checked) => handleRequiredChange(index, checked)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={attribute.points}
                          onChange={(e) => handlePointsChange(index, e.target.value)}
                          className="w-20"
                          min={0}
                        />
                      </td>
                      {isTierGapAttribute(attribute) ? (
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            value={attribute.maxDifference}
                            onChange={(e) => handleMaxDifferenceChange(index, e.target.value)}
                            className="w-20"
                            min={0}
                          />
                        </td>
                      ) : settings.attributes.some((attr) => isTierGapAttribute(attr)) ? (
                        <td className="py-3 px-4">-</td>
                      ) : null}
                      <td className="py-3 px-4 min-w-[200px]">
                        <SearchableDropdown
                          options={campaignFields.map((field) => ({ label: field, value: field, group: "Fields" }))}
                          value={[attribute.sourceCampaign]}
                          onChange={(values) => handleSourceCampaignChange(index, values)}
                          placeholder="Select campaign field"
                          className="w-full"
                          maxItems={1}
                        />
                      </td>
                      <td className="py-3 px-4 min-w-[200px]">
                        <SearchableDropdown
                          options={playlistFields.map((field) => ({ label: field, value: field, group: "Fields" }))}
                          value={[attribute.sourcePlaylist]}
                          onChange={(values) => handleSourcePlaylistChange(index, values)}
                          placeholder="Select playlist field"
                          className="w-full"
                          maxItems={1}
                        />
                      </td>
                    </tr>
                  ))}

                  {/* Secondary Matching Attributes */}
                  <tr className="bg-muted/30">
                    <td colSpan={6} className="py-2 px-4 font-medium">
                      Secondary Matching Attributes
                    </td>
                  </tr>
                  {settings.attributes.slice(4).map((attribute, index) => (
                    <tr key={attribute.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {attribute.name}
                          {attribute.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Switch
                          checked={attribute.required}
                          onCheckedChange={(checked) => handleRequiredChange(index + 4, checked)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={attribute.points}
                          onChange={(e) => handlePointsChange(index + 4, e.target.value)}
                          className="w-20"
                          min={0}
                        />
                      </td>
                      {settings.attributes.some((attr) => isTierGapAttribute(attr)) && <td className="py-3 px-4">-</td>}
                      <td className="py-3 px-4 min-w-[200px]">
                        <SearchableDropdown
                          options={campaignFields.map((field) => ({ label: field, value: field, group: "Fields" }))}
                          value={[attribute.sourceCampaign]}
                          onChange={(values) => handleSourceCampaignChange(index + 4, values)}
                          placeholder="Select campaign field"
                          className="w-full"
                          maxItems={1}
                        />
                      </td>
                      <td className="py-3 px-4 min-w-[200px]">
                        <SearchableDropdown
                          options={playlistFields.map((field) => ({ label: field, value: field, group: "Fields" }))}
                          value={[attribute.sourcePlaylist]}
                          onChange={(values) => handleSourcePlaylistChange(index + 4, values)}
                          placeholder="Select playlist field"
                          className="w-full"
                          maxItems={1}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="text-red-500">*</span> Required attributes must match for a campaign to be considered
              </div>
            </div>
          </div>
        )}

        {/* Test Match Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Test Match</h3>
          <div className="flex flex-col space-y-2">
            <label htmlFor="campaign-select" className="text-sm font-medium">
              Select Campaign
            </label>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger id="campaign-select">
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {testCampaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id.toString()}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {testError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{testError}</AlertDescription>
            </Alert>
          )}

          {testResults && testResults.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Top 5 Matching Playlists</h3>

              {testResults.map((result, index) => (
                <div key={result.playlist.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium">
                      {index + 1}. {result.playlist.name || result.playlist.id}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        Score: {result.score}/{result.totalPossiblePoints}
                      </span>
                      <Progress value={(result.score / result.totalPossiblePoints) * 100} className="w-24" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Score Breakdown:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {result.breakdown.map((item) => (
                        <div key={item.attributeId} className="flex items-center space-x-2 text-sm">
                          {item.matched ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span>
                            {item.attributeName}
                            {item.required && <span className="text-red-500">*</span>}:
                          </span>
                          <Badge variant={item.matched ? "default" : "outline"}>
                            {item.matched ? `+${item.points}` : "0"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.campaignValue !== undefined ? `${item.campaignValue}` : "N/A"} ↔{" "}
                            {item.playlistValue !== undefined ? `${item.playlistValue}` : "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {testResults && testResults.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No matching playlists found for this campaign.</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button onClick={handleRunTest} disabled={testLoading || !selectedCampaignId}>
          {testLoading ? "Running..." : "Run Match Test"}
        </Button>
      </CardFooter>
    </Card>
  )
}
