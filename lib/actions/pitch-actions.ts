"use server"

import { revalidatePath } from "next/cache"
import {
  createPitch,
  updatePitch,
  deletePitch,
  getAllPitches,
  getPitchById,
  getPitchesByCampaign,
  getPitchesByClient,
  getPitchesByPlaylist,
  getPitchesByStatus,
  createPitchesForCampaign,
  type Pitch,
  PITCH_STATUSES,
} from "@/lib/pitches"
import { getCampaignById } from "@/lib/campaigns"
import { getPlaylistById } from "@/lib/playlists"

// Create a new pitch
export async function createPitchAction(
  pitchData: Omit<Pitch, "pitch_id" | "created_at" | "updated_at">,
): Promise<{ success: boolean; message: string; pitch?: Pitch }> {
  try {
    // Validate that the campaign exists
    const campaign = await getCampaignById(pitchData.campaign_id)
    if (!campaign) {
      return { success: false, message: "Campaign not found" }
    }

    // Validate that the playlist exists
    const playlist = await getPlaylistById(pitchData.playlist_id)
    if (!playlist) {
      return { success: false, message: "Playlist not found" }
    }

    // Create the pitch
    const pitch = await createPitch(pitchData)

    if (!pitch) {
      return { success: false, message: "Failed to create pitch" }
    }

    revalidatePath("/dashboard/campaigns")
    revalidatePath(`/dashboard/campaigns/${pitchData.campaign_id}`)
    return { success: true, message: "Pitch created successfully", pitch }
  } catch (error) {
    console.error("Error creating pitch:", error)
    return { success: false, message: "An error occurred while creating the pitch" }
  }
}

// Update an existing pitch
export async function updatePitchAction(
  pitchId: number,
  pitchData: Partial<Omit<Pitch, "pitch_id" | "created_at" | "updated_at">>,
): Promise<{ success: boolean; message: string; pitch?: Pitch }> {
  try {
    // If campaign_id is provided, validate that the campaign exists
    if (pitchData.campaign_id) {
      const campaign = await getCampaignById(pitchData.campaign_id)
      if (!campaign) {
        return { success: false, message: "Campaign not found" }
      }
    }

    // If playlist_id is provided, validate that the playlist exists
    if (pitchData.playlist_id) {
      const playlist = await getPlaylistById(pitchData.playlist_id)
      if (!playlist) {
        return { success: false, message: "Playlist not found" }
      }
    }

    // Update the pitch
    const pitch = await updatePitch(pitchId, pitchData)

    if (!pitch) {
      return { success: false, message: "Failed to update pitch" }
    }

    revalidatePath("/dashboard/campaigns")
    revalidatePath(`/dashboard/campaigns/${pitch.campaign_id}`)
    return { success: true, message: "Pitch updated successfully", pitch }
  } catch (error) {
    console.error("Error updating pitch:", error)
    return { success: false, message: "An error occurred while updating the pitch" }
  }
}

// Delete a pitch
export async function deletePitchAction(pitchId: number): Promise<{ success: boolean; message: string }> {
  try {
    // Get the pitch to get the campaign_id for path revalidation
    const pitch = await getPitchById(pitchId)
    if (!pitch) {
      return { success: false, message: "Pitch not found" }
    }

    const campaignId = pitch.campaign_id

    // Delete the pitch
    const result = await deletePitch(pitchId)

    if (!result) {
      return { success: false, message: "Failed to delete pitch" }
    }

    revalidatePath("/dashboard/campaigns")
    revalidatePath(`/dashboard/campaigns/${campaignId}`)
    return { success: true, message: "Pitch deleted successfully" }
  } catch (error) {
    console.error("Error deleting pitch:", error)
    return { success: false, message: "An error occurred while deleting the pitch" }
  }
}

// Get all pitches
export async function getAllPitchesAction(): Promise<Pitch[]> {
  try {
    return await getAllPitches()
  } catch (error) {
    console.error("Error getting all pitches:", error)
    return []
  }
}

// Get a pitch by ID
export async function getPitchByIdAction(pitchId: number): Promise<Pitch | null> {
  try {
    return await getPitchById(pitchId)
  } catch (error) {
    console.error("Error getting pitch by ID:", error)
    return null
  }
}

// Get pitches by campaign
export async function getPitchesByCampaignAction(campaignId: number): Promise<Pitch[]> {
  try {
    return await getPitchesByCampaign(campaignId)
  } catch (error) {
    console.error("Error getting pitches by campaign:", error)
    return []
  }
}

// Get pitches by client
export async function getPitchesByClientAction(clientId: string): Promise<Pitch[]> {
  try {
    return await getPitchesByClient(clientId)
  } catch (error) {
    console.error("Error getting pitches by client:", error)
    return []
  }
}

// Get pitches by playlist
export async function getPitchesByPlaylistAction(playlistId: string): Promise<Pitch[]> {
  try {
    return await getPitchesByPlaylist(playlistId)
  } catch (error) {
    console.error("Error getting pitches by playlist:", error)
    return []
  }
}

// Get pitches by status
export async function getPitchesByStatusAction(status: string): Promise<Pitch[]> {
  try {
    if (!PITCH_STATUSES.includes(status as any)) {
      console.error("Invalid pitch status:", status)
      return []
    }
    return await getPitchesByStatus(status as any)
  } catch (error) {
    console.error("Error getting pitches by status:", error)
    return []
  }
}

// Create multiple pitches for a campaign
export async function createPitchesForCampaignAction(
  campaignId: number,
  playlistIds: string[],
): Promise<{ success: boolean; message: string; count: number }> {
  try {
    // Get the campaign to get the client_id and track_link
    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      return { success: false, message: "Campaign not found", count: 0 }
    }

    // Validate that all playlists exist
    for (const playlistId of playlistIds) {
      const playlist = await getPlaylistById(playlistId)
      if (!playlist) {
        return { success: false, message: `Playlist not found: ${playlistId}`, count: 0 }
      }
    }

    // Create the pitches
    const result = await createPitchesForCampaign(campaignId, campaign.client_id, campaign.track_link, playlistIds)

    if (!result.success) {
      return { success: false, message: "Failed to create pitches", count: 0 }
    }

    revalidatePath("/dashboard/campaigns")
    revalidatePath(`/dashboard/campaigns/${campaignId}`)
    return {
      success: true,
      message: `Successfully created ${result.count} pitches`,
      count: result.count,
    }
  } catch (error) {
    console.error("Error creating pitches for campaign:", error)
    return { success: false, message: "An error occurred while creating pitches", count: 0 }
  }
}

// Update pitch status
export async function updatePitchStatusAction(
  pitchId: number,
  status: string,
  placementDate?: number,
  placementDuration?: number,
): Promise<{ success: boolean; message: string; pitch?: Pitch }> {
  try {
    if (!PITCH_STATUSES.includes(status as any)) {
      return { success: false, message: "Invalid pitch status" }
    }

    const updateData: Partial<Omit<Pitch, "pitch_id" | "created_at" | "updated_at">> = {
      status: status as any,
    }

    // Add placement date and duration if provided
    if (status === "accepted" && placementDate) {
      updateData.placement_date = placementDate

      if (placementDuration) {
        updateData.placement_duration = placementDuration
      }
    }

    return await updatePitchAction(pitchId, updateData)
  } catch (error) {
    console.error("Error updating pitch status:", error)
    return { success: false, message: "An error occurred while updating the pitch status" }
  }
}
