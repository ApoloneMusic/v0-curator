"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, MoreHorizontal, Search, Edit, Trash2, ExternalLink, Plus } from "lucide-react"
import { CampaignEditDialog } from "./campaign-edit-dialog"
import { CampaignCreateDialog } from "./campaign-create-dialog"
import {
  getAllCampaignsAction,
  updateCampaignAction,
  deleteCampaignAction,
  createCampaignAction,
} from "@/lib/actions/campaign-actions"
import type { Campaign } from "@/lib/campaigns"
import { CAMPAIGN_STATUSES } from "@/lib/campaigns"
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

export function CampaignsTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [sortField, setSortField] = useState<keyof Campaign>("date_created")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<number | null>(null)

  // Campaign types (for filtering)
  const campaignTypes = ["Playlist Pitch", "Influencer Campaign", "Radio Promotion", "PR Campaign", "Other"]

  // Load campaigns on component mount
  useEffect(() => {
    loadCampaigns()
  }, [])

  // Load campaigns from the server
  const loadCampaigns = async () => {
    setIsLoading(true)
    try {
      const data = await getAllCampaignsAction()
      setCampaigns(data)
      setFilteredCampaigns(data)
    } catch (error) {
      console.error("Failed to fetch campaigns:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters and sorting when dependencies change
  useEffect(() => {
    // Apply filters and search
    let result = [...campaigns]

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      result = result.filter((campaign) => campaign.status === statusFilter)
    }

    // Apply type filter
    if (typeFilter && typeFilter !== "all") {
      result = result.filter((campaign) => campaign.campaign_type === typeFilter)
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (campaign) =>
          campaign.track_name.toLowerCase().includes(query) ||
          campaign.client_id.toLowerCase().includes(query) ||
          campaign.campaign_id.toString().includes(query),
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

    setFilteredCampaigns(result)
  }, [campaigns, searchQuery, statusFilter, typeFilter, sortField, sortDirection])

  const handleSort = (field: keyof Campaign) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleEditCampaign = useCallback((campaign: Campaign) => {
    setEditCampaign(campaign)
    setIsEditDialogOpen(true)
  }, [])

  const handleSaveCampaign = async (updatedCampaign: Campaign) => {
    try {
      const { success, campaign } = await updateCampaignAction(updatedCampaign.campaign_id, {
        campaign_type: updatedCampaign.campaign_type,
        track_name: updatedCampaign.track_name,
        track_link: updatedCampaign.track_link,
        track_popularity: updatedCampaign.track_popularity,
        artist_popularity: updatedCampaign.artist_popularity,
        artist_followers: updatedCampaign.artist_followers,
        release_date: updatedCampaign.release_date,
        genre: updatedCampaign.genre,
        subgenre: updatedCampaign.subgenre,
        mood: updatedCampaign.mood,
        language: updatedCampaign.language,
        vocal: updatedCampaign.vocal,
        pitches: updatedCampaign.pitches,
        status: updatedCampaign.status,
        matches: updatedCampaign.matches,
        matched_playlists: updatedCampaign.matched_playlists,
        accepted: updatedCampaign.accepted,
        declined: updatedCampaign.declined,
      })

      if (success && campaign) {
        setCampaigns((prevCampaigns) =>
          prevCampaigns.map((c) => (c.campaign_id === campaign.campaign_id ? campaign : c)),
        )
      }
    } catch (error) {
      console.error("Failed to update campaign:", error)
    } finally {
      setIsEditDialogOpen(false)
    }
  }

  const handleCreateCampaign = async (campaignData: Omit<Campaign, "campaign_id" | "date_created" | "client_id">) => {
    try {
      // Use a default client ID if none is provided
      const clientId = campaignData.client_id || "default_client"

      const { success, campaign } = await createCampaignAction(clientId, {
        campaign_type: campaignData.campaign_type,
        track_name: campaignData.track_name,
        track_link: campaignData.track_link,
        track_popularity: campaignData.track_popularity,
        artist_followers: campaignData.artist_followers,
        release_date: campaignData.release_date,
        genre: campaignData.genre,
        subgenre: campaignData.subgenre,
        mood: campaignData.mood,
        language: campaignData.language,
        vocal: campaignData.vocal,
        pitches: campaignData.pitches,
        status: campaignData.status,
        matches: campaignData.matches,
        matched_playlists: campaignData.matched_playlists,
        accepted: campaignData.accepted,
        declined: campaignData.declined,
      })

      if (success && campaign) {
        // Add the new campaign to the beginning of the list
        setCampaigns((prevCampaigns) => [campaign, ...prevCampaigns])

        // Show the newly created campaign even if filters are applied
        setStatusFilter("")
        setTypeFilter("")
        setSearchQuery("")
      }
    } catch (error) {
      console.error("Failed to create campaign:", error)
    } finally {
      setIsCreateDialogOpen(false)
    }
  }

  const confirmDeleteCampaign = useCallback((campaignId: number) => {
    setCampaignToDelete(campaignId)
    setDeleteConfirmOpen(true)
  }, [])

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return

    try {
      const { success } = await deleteCampaignAction(campaignToDelete)

      if (success) {
        setCampaigns((prevCampaigns) => prevCampaigns.filter((c) => c.campaign_id !== campaignToDelete))
      }
    } catch (error) {
      console.error("Failed to delete campaign:", error)
    } finally {
      setDeleteConfirmOpen(false)
      setCampaignToDelete(null)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "order":
        return "default"
      case "match":
        return "secondary"
      case "pitch":
        return "outline"
      case "accepted":
        return "success"
      case "declined":
        return "destructive"
      case "placed":
        return "purple"
      case "closed":
        return "outline"
      default:
        return "default"
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading campaigns...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
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
              {CAMPAIGN_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">All Types</SelectItem>
              {campaignTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setIsCreateDialogOpen(true)} className="h-9">
            <Plus className="mr-2 h-4 w-4" />
            Add Campaign
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort("campaign_id")}>
                ID
                {sortField === "campaign_id" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 inline h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 inline h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("date_created")}>
                Date
                {sortField === "date_created" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 inline h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 inline h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead>Client ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Track</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Pitches</TableHead>
              <TableHead className="text-center">Matches</TableHead>
              <TableHead className="text-center">Accepted</TableHead>
              <TableHead className="text-center">Declined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  No campaigns found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.campaign_id}>
                  <TableCell className="font-medium">{campaign.campaign_id}</TableCell>
                  <TableCell>{formatDate(campaign.date_created)}</TableCell>
                  <TableCell>{campaign.client_id}</TableCell>
                  <TableCell>{campaign.campaign_type}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{campaign.track_name}</span>
                      {campaign.track_link && (
                        <a
                          href={campaign.track_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground flex items-center hover:underline"
                        >
                          Link <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusBadgeVariant(campaign.status)}>{campaign.status}</Badge>
                  </TableCell>
                  <TableCell className="text-center">{campaign.pitches}</TableCell>
                  <TableCell className="text-center">{campaign.matches}</TableCell>
                  <TableCell className="text-center">{campaign.accepted}</TableCell>
                  <TableCell className="text-center">{campaign.declined}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => confirmDeleteCampaign(campaign.campaign_id)}
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

      {/* Edit Campaign Dialog */}
      {editCampaign && (
        <CampaignEditDialog
          campaign={editCampaign}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSaveCampaign}
        />
      )}

      {/* Create Campaign Dialog */}
      <CampaignCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreateCampaign}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the campaign and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCampaign} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
