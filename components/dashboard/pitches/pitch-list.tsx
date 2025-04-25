"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAllPitchesAction, getPitchesByCampaignAction, updatePitchStatusAction } from "@/lib/actions/pitch-actions"
import type { Pitch } from "@/lib/pitches"
import { Calendar, Clock } from "lucide-react"

interface PitchListProps {
  campaignId?: number
}

export function PitchList({ campaignId }: PitchListProps) {
  const [pitches, setPitches] = useState<Pitch[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadPitches = async () => {
      setIsLoading(true)
      try {
        let data: Pitch[] = []

        if (campaignId) {
          data = await getPitchesByCampaignAction(campaignId)
        } else {
          data = await getAllPitchesAction()
        }

        setPitches(data)
      } catch (error) {
        console.error("Failed to fetch pitches:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPitches()
  }, [campaignId])

  const handleStatusUpdate = async (pitchId: number, newStatus: string) => {
    try {
      const result = await updatePitchStatusAction(pitchId, newStatus)
      if (result.success && result.pitch) {
        setPitches(pitches.map((pitch) => (pitch.pitch_id === pitchId ? result.pitch! : pitch)))
      }
    } catch (error) {
      console.error("Failed to update pitch status:", error)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "matched":
        return "secondary"
      case "pitched":
        return "default"
      case "accepted":
        return "success"
      case "declined":
        return "destructive"
      case "expired":
        return "outline"
      default:
        return "default"
    }
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Not scheduled"
    return new Date(timestamp).toLocaleDateString()
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading pitches...</div>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Playlist</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Placement Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pitches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No pitches found.
                </TableCell>
              </TableRow>
            ) : (
              pitches.map((pitch) => (
                <TableRow key={pitch.pitch_id}>
                  <TableCell className="font-medium">{pitch.pitch_id}</TableCell>
                  <TableCell>{pitch.campaign_id}</TableCell>
                  <TableCell>{pitch.playlist_id}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusBadgeVariant(pitch.status)}>{pitch.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {pitch.placement_date ? (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(pitch.placement_date)}
                      </div>
                    ) : (
                      "Not scheduled"
                    )}
                  </TableCell>
                  <TableCell>
                    {pitch.placement_duration ? (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {pitch.placement_duration} days
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {pitch.status === "matched" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(pitch.pitch_id, "pitched")}
                        >
                          Mark as Pitched
                        </Button>
                      )}
                      {pitch.status === "pitched" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            onClick={() => handleStatusUpdate(pitch.pitch_id, "accepted")}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                            onClick={() => handleStatusUpdate(pitch.pitch_id, "declined")}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
