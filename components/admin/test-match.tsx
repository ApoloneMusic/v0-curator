"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { runTestMatch } from "@/lib/actions/matching-actions"
import type { MatchResult } from "@/lib/matching-engine"

interface TestMatchProps {
  campaigns: { id: number; name: string }[]
}

export function TestMatch({ campaigns }: TestMatchProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<MatchResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRunTest = async () => {
    if (!selectedCampaignId) {
      setError("Please select a campaign")
      return
    }

    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await runTestMatch(Number(selectedCampaignId))

      if (response.success && response.results) {
        setResults(response.results)
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError("An error occurred while running the test")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Match</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="campaign-select" className="text-sm font-medium">
              Select Campaign
            </label>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger id="campaign-select">
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id.toString()}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && results.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Top 5 Matching Playlists</h3>

              {results.map((result, index) => (
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

          {results && results.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No matching playlists found for this campaign.</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleRunTest} disabled={isLoading || !selectedCampaignId}>
          {isLoading ? "Running..." : "Run Match Test"}
        </Button>
      </CardFooter>
    </Card>
  )
}
