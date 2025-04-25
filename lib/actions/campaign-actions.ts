"use server"

import { revalidatePath } from "next/cache"
import {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getAllCampaigns,
  getCampaignById,
  getCampaignsByClient,
  type Campaign,
} from "@/lib/campaigns"
import { getPitchesByCampaign, deletePitch } from "@/lib/pitches"
import { getAllPlaylists } from "@/lib/playlists"
import { autoMatchCampaign } from "@/lib/matching-engine"

// Create a new campaign
export async function createCampaignAction(
  clientId: string,
  campaignData: Omit<Campaign, "campaign_id" | "date_created" | "client_id">,
): Promise<{ success: boolean; message: string; campaign?: Campaign }> {
  try {
    const campaign = await createCampaign(clientId, campaignData)

    if (!campaign) {
      return { success: false, message: "Failed to create campaign" }
    }

    // Automatically match the campaign with playlists if pitches > 0
    if (campaign.pitches && campaign.pitches > 0) {
      const playlists = await getAllPlaylists()
      if (playlists && playlists.length > 0) {
        const matchResult = await autoMatchCampaign(campaign, playlists)
        console.log(`Auto-matching result: ${matchResult.message}`)
      }
    }

    revalidatePath("/dashboard/campaigns")
    return { success: true, message: "Campaign created successfully", campaign }
  } catch (error) {
    console.error("Error creating campaign:", error)
    return { success: false, message: "An error occurred while creating the campaign" }
  }
}

// Update an existing campaign
export async function updateCampaignAction(
  campaignId: number,
  campaignData: Partial<Omit<Campaign, "campaign_id" | "date_created" | "client_id">>,
): Promise<{ success: boolean; message: string; campaign?: Campaign }> {
  try {
    const campaign = await updateCampaign(campaignId, campaignData)

    if (!campaign) {
      return { success: false, message: "Failed to update campaign" }
    }

    revalidatePath("/dashboard/campaigns")
    revalidatePath(`/dashboard/campaigns/${campaignId}`)
    return { success: true, message: "Campaign updated successfully", campaign }
  } catch (error) {
    console.error("Error updating campaign:", error)
    return { success: false, message: "An error occurred while updating the campaign" }
  }
}

// Delete a campaign
export async function deleteCampaignAction(campaignId: number): Promise<{ success: boolean; message: string }> {
  try {
    // First, delete all pitches associated with this campaign
    const pitches = await getPitchesByCampaign(campaignId)
    for (const pitch of pitches) {
      await deletePitch(pitch.pitch_id)
    }

    // Then delete the campaign
    const result = await deleteCampaign(campaignId)

    if (!result) {
      return { success: false, message: "Failed to delete campaign" }
    }

    revalidatePath("/dashboard/campaigns")
    return { success: true, message: "Campaign deleted successfully" }
  } catch (error) {
    console.error("Error deleting campaign:", error)
    return { success: false, message: "An error occurred while deleting the campaign" }
  }
}

// Get all campaigns
export async function getAllCampaignsAction(): Promise<Campaign[]> {
  try {
    return await getAllCampaigns()
  } catch (error) {
    console.error("Error getting all campaigns:", error)
    return []
  }
}

// Get a campaign by ID
export async function getCampaignByIdAction(campaignId: number): Promise<Campaign | null> {
  try {
    return await getCampaignById(campaignId)
  } catch (error) {
    console.error("Error getting campaign by ID:", error)
    return null
  }
}

// Get campaigns by client
export async function getCampaignsByClientAction(clientId: string): Promise<Campaign[]> {
  try {
    return await getCampaignsByClient(clientId)
  } catch (error) {
    console.error("Error getting campaigns by client:", error)
    return []
  }
}
