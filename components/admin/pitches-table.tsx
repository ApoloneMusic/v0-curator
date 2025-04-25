"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, MoreHorizontal, Search, Edit, Trash2, ExternalLink, Plus } from "lucide-react"
import { PitchEditDialog } from "./pitch-edit-dialog"
import { PitchCreateDialog } from "./pitch-create-dialog"
import {
  getAllPitchesAction,
  updatePitchAction,
  deletePitchAction,
  createPitchAction,
} from "@/lib/actions/pitch-actions"
import { getAllCampaignsAction } from "@/lib/actions/campaign-actions"
import { getAllPlaylists } from "@/lib/actions/playlist-actions"
import type { Pitch } from "@/lib/pitches"
import type { Campaign } from "@/lib/campaigns"
import type { Playlist } from "@/lib/playlists"
import { PITCH_STATUSES } from "@/lib/pitches"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"

export function PitchesTable() {
  const [pitches, setPitches] = useState<Pitch[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [filteredPitches, setFilteredPitches] = useState<Pitch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [campaignFilter, setCampaignFilter] = useState<string>("")
  const [clientFilter, setClientFilter] = useState<string>("")
  const [sortField, setSortField] = useState<keyof Pitch>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [editPitch, setEditPitch] = useState<Pitch | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pitchToDelete, setPitchToDelete] = useState<number | null>(null)

  // Load pitches, campaigns, and playlists on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Load all necessary data from the server
  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load pitches, campaigns, and playlists in parallel
      const [pitchesData, campaignsData, playlistsData] = await Promise.all([
        getAllPitchesAction(),
        getAllCampaignsAction(),
        getAllPlaylists(),
      ])

      setPitches(pitchesData)
      setFilteredPitches(pitchesData)
      setCampaigns(campaignsData)
      setPlaylists(playlistsData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters and sorting when dependencies change
  useEffect(() => {
    // Apply filters and search
    let result = [...pitches]

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      result = result.filter((pitch) => pitch.status === statusFilter)
    }

    // Apply campaign filter
    if (campaignFilter && campaignFilter !== "all") {
      const campaignId = Number.parseInt(campaignFilter, 10)
      result = result.filter((pitch) => pitch.campaign_id === campaignId)
    }

    // Apply client filter
    if (clientFilter && clientFilter !== "all") {
      result = result.filter((pitch) => pitch.client_id === clientFilter)
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (pitch) =>
          pitch.pitch_id.toString().includes(query) ||
          pitch.campaign_id.toString().includes(query) ||
          pitch.client_id.toLowerCase().includes(query) ||
          pitch.playlist_id.toLowerCase().includes(query),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return 0
    })

    setFilteredPitches(result)
  }, [pitches, searchQuery, statusFilter, campaignFilter, clientFilter, sortField, sortDirection])

  // Get unique client IDs for filtering
  const uniqueClientIds = [...new Set(pitches.map((pitch) => pitch.client_id))].sort()

  const handleSort = (field: keyof Pitch) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleEditPitch = (pitch: Pitch) => {
    setEditPitch(pitch)
    setIsEditDialogOpen(true)
  }

  const handleSavePitch = async (updatedPitch: Pitch) => {
    try {
      const { success, pitch } = await updatePitchAction(updatedPitch.pitch_id, {
        campaign_id: updatedPitch.campaign_id,
        client_id: updatedPitch.client_id,
        track_link: updatedPitch.track_link,
        playlist_id: updatedPitch.playlist_id,
        status: updatedPitch.status,
        placement_date: updatedPitch.placement_date,
        placement_duration: updatedPitch.placement_duration,
      })

      if (success && pitch) {
        setPitches((prevPitches) => prevPitches.map((p) => (p.pitch_id === pitch.pitch_id ? pitch : p)))
      }
    } catch (error) {
      console.error("Failed to update pitch:", error)
    } finally {
      setIsEditDialogOpen(false)
    }
  }

  const handleCreatePitch = async (pitchData: Omit<Pitch, "pitch_id" | "created_at" | "updated_at">) => {
    try {
      const { success, pitch } = await createPitchAction(pitchData)

      if (success && pitch) {
        // Add the new pitch to the beginning of the list
        setPitches((prevPitches) => [pitch, ...prevPitches])

        // Show the newly created pitch even if filters are applied
        setStatusFilter("")
        setCampaignFilter("")
        setClientFilter("")
        setSearchQuery("")
      }
    } catch (error) {
      console.error("Failed to create pitch:", error)
    } finally {
      setIsCreateDialogOpen(false)
    }
  }

  const confirmDeletePitch = (pitchId: number) => {
    setPitchToDelete(pitchId)
    setDeleteConfirmOpen(true)
  }

  const handleDeletePitch = async () => {
    if (!pitchToDelete) return

    try {
      const { success } = await deletePitchAction(pitchToDelete)

      if (success) {
        setPitches((prevPitches) => prevPitches.filter((p) => p.pitch_id !== pitchToDelete))
      }
    } catch (error) {
      console.error("Failed to delete pitch:", error)
    } finally {
      setDeleteConfirmOpen(false)
      setPitchToDelete(null)
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

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "MMM d, yyyy")
  }

  // Get playlist name by ID
  const getPlaylistName = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId)
    return playlist?.name || playlist?.spotifyLink?.split("/").pop() || playlistId
  }

  // Get campaign name by ID
  const getCampaignName = (campaignId: number) => {
    const campaign = campaigns.find((c) => c.campaign_id === campaignId)
    return campaign ? `#${campaignId} - ${campaign.track_name}` : `#${campaignId}`
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading pitches...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pitches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 md:w-[300px] lg:w-[400px]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">All Statuses</SelectItem>
              {PITCH_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="Filter by campaign" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.campaign_id} value={campaign.campaign_id.toString()}>
                  #{campaign.campaign_id} - {campaign.track_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">All Clients</SelectItem>
              {uniqueClientIds.map((clientId) => (
                <SelectItem key={clientId} value={clientId}>
                  {clientId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setIsCreateDialogOpen(true)} className="h-9">
            <Plus className="mr-2 h-4 w-4" />
            Add Pitch
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] cursor-pointer" onClick={() => handleSort("pitch_id")}>
                ID
                {sortField === "pitch_id" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 inline h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 inline h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("campaign_id")}>
                Campaign
                {sortField === "campaign_id" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 inline h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 inline h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("client_id")}>
                Client
                {sortField === "client_id" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 inline h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 inline h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead>Playlist</TableHead>
              <TableHead className="text-center cursor-pointer" onClick={() => handleSort("status")}>
                Status
                {sortField === "status" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 inline h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 inline h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>
                Created
                {sortField === "created_at" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 inline h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 inline h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead>Placement</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPitches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No pitches found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPitches.map((pitch) => (
                <TableRow key={pitch.pitch_id}>
                  <TableCell className="font-medium">{pitch.pitch_id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{getCampaignName(pitch.campaign_id)}</span>
                      {pitch.track_link && (
                        <a
                          href={pitch.track_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground flex items-center hover:underline"
                        >
                          Track <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{pitch.client_id}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={getPlaylistName(pitch.playlist_id)}>
                      {getPlaylistName(pitch.playlist_id)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusBadgeVariant(pitch.status)}>{pitch.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(pitch.created_at)}</TableCell>
                  <TableCell>
                    {pitch.placement_date ? (
                      <div className="flex flex-col">
                        <span>{formatDate(pitch.placement_date)}</span>
                        {pitch.placement_duration && (
                          <span className="text-xs text-muted-foreground">{pitch.placement_duration} days</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not scheduled</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPitch(pitch)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => confirmDeletePitch(pitch.pitch_id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Pitch Dialog */}
      {editPitch && (
        <PitchEditDialog
          pitch={editPitch}
          campaigns={campaigns}
          playlists={playlists}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSavePitch}
        />
      )}

      {/* Create Pitch Dialog */}
      <PitchCreateDialog
        campaigns={campaigns}
        playlists={playlists}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreatePitch}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the pitch and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePitch} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
