"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Pitch } from "@/lib/pitches"
import type { Campaign } from "@/lib/campaigns"
import type { Playlist } from "@/lib/playlists"
import { PITCH_STATUSES } from "@/lib/pitches"

interface PitchEditDialogProps {
  pitch: Pitch
  campaigns: Campaign[]
  playlists: Playlist[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (pitch: Pitch) => void
}

export function PitchEditDialog({ pitch, campaigns, playlists, open, onOpenChange, onSave }: PitchEditDialogProps) {
  const [editedPitch, setEditedPitch] = useState<Pitch>({ ...pitch })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    pitch.placement_date ? new Date(pitch.placement_date) : undefined,
  )

  // Reset the edited pitch when the dialog opens or the pitch changes
  useEffect(() => {
    if (open) {
      setEditedPitch({ ...pitch })
      setSelectedDate(pitch.placement_date ? new Date(pitch.placement_date) : undefined)
    }
  }, [open, pitch])

  // Update client_id and track_link when campaign_id changes
  useEffect(() => {
    const campaign = campaigns.find((c) => c.campaign_id === editedPitch.campaign_id)
    if (campaign) {
      setEditedPitch((prev) => ({
        ...prev,
        client_id: campaign.client_id,
        track_link: campaign.track_link,
      }))
    }
  }, [editedPitch.campaign_id, campaigns])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "placement_duration") {
      setEditedPitch({
        ...editedPitch,
        [name]: Number.parseInt(value) || 0,
      })
    } else {
      setEditedPitch({
        ...editedPitch,
        [name]: value,
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setEditedPitch({
      ...editedPitch,
      [name]: name === "campaign_id" ? Number.parseInt(value) : value,
    })
  }

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
    setEditedPitch({
      ...editedPitch,
      placement_date: date ? date.getTime() : undefined,
    })
  }

  const handleSave = () => {
    onSave(editedPitch)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pitch #{pitch.pitch_id}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pitch_id">Pitch ID</Label>
            <Input id="pitch_id" name="pitch_id" value={editedPitch.pitch_id} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign_id">Campaign</Label>
            <Select
              value={editedPitch.campaign_id.toString()}
              onValueChange={(value) => handleSelectChange("campaign_id", value)}
            >
              <SelectTrigger id="campaign_id" className="w-full">
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent position="popper">
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.campaign_id} value={campaign.campaign_id.toString()}>
                    #{campaign.campaign_id} - {campaign.track_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">Client ID</Label>
            <Input
              id="client_id"
              name="client_id"
              value={editedPitch.client_id}
              onChange={handleInputChange}
              placeholder="Enter client ID"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="track_link">Track Link</Label>
            <Input
              id="track_link"
              name="track_link"
              value={editedPitch.track_link}
              onChange={handleInputChange}
              placeholder="https://..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="playlist_id">Playlist</Label>
            <Select value={editedPitch.playlist_id} onValueChange={(value) => handleSelectChange("playlist_id", value)}>
              <SelectTrigger id="playlist_id" className="w-full">
                <SelectValue placeholder="Select playlist" />
              </SelectTrigger>
              <SelectContent position="popper">
                {playlists.map((playlist) => (
                  <SelectItem key={playlist.id} value={playlist.id}>
                    {playlist.name || playlist.spotifyLink.split("/").pop() || playlist.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={editedPitch.status} onValueChange={(value) => handleSelectChange("status", value)}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper">
                {PITCH_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="placement_date">Placement Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDate} onSelect={handleDateChange} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placement_duration">Duration (days)</Label>
              <Input
                id="placement_duration"
                name="placement_duration"
                type="number"
                min="0"
                value={editedPitch.placement_duration || ""}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
