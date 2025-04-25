"use server"

import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"
import { matchCampaignToPlaylists, type MatchResult } from "../matching-engine"
import { getAllCampaigns, getCampaignById } from "../campaigns"
import { getAllPlaylists } from "../playlists"

export type MatchingAttribute = {
  id: string
  name: string
  required: boolean
  points: number
  sourceCampaign: string
  sourcePlaylist: string
}

export type TierGapAttribute = MatchingAttribute & {
  maxDifference: number
}

export type MatchingSettings = {
  attributes: (MatchingAttribute | TierGapAttribute)[]
}

const MATCHING_SETTINGS_KEY = "matching:settings"

export async function getDefaultMatchingSettings(): Promise<MatchingSettings> {
  return {
    attributes: [
      // Primary matching attributes
      {
        id: "genre",
        name: "Genre",
        required: true,
        points: 20,
        sourceCampaign: "genre",
        sourcePlaylist: "genre",
      },
      {
        id: "language",
        name: "Language",
        required: true,
        points: 20,
        sourceCampaign: "language",
        sourcePlaylist: "language",
      },
      {
        id: "vocal_type",
        name: "Vocal Type",
        required: true,
        points: 20,
        sourceCampaign: "vocal_type",
        sourcePlaylist: "vocal_type",
      },
      {
        id: "tier_gap",
        name: "Tier Gap",
        required: true,
        points: 20,
        maxDifference: 5,
        sourceCampaign: "tier",
        sourcePlaylist: "tier",
      },
      // Secondary matching attributes
      {
        id: "subgenre",
        name: "Subgenre",
        required: false,
        points: 10,
        sourceCampaign: "subgenre",
        sourcePlaylist: "subgenre",
      },
      {
        id: "mood",
        name: "Mood",
        required: false,
        points: 15,
        sourceCampaign: "mood",
        sourcePlaylist: "mood",
      },
      {
        id: "tempo",
        name: "Tempo",
        required: false,
        points: 10,
        sourceCampaign: "tempo",
        sourcePlaylist: "tempo",
      },
    ],
  }
}

export async function getMatchingSettings(): Promise<MatchingSettings> {
  try {
    const settings = await kv.get<MatchingSettings>(MATCHING_SETTINGS_KEY)
    return settings || (await getDefaultMatchingSettings())
  } catch (error) {
    console.error("Error fetching matching settings:", error)
    return await getDefaultMatchingSettings()
  }
}

export async function saveMatchingSettings(settings: MatchingSettings): Promise<{ success: boolean; message: string }> {
  try {
    await kv.set(MATCHING_SETTINGS_KEY, settings)
    revalidatePath("/admin/dashboard/matching")
    return { success: true, message: "Matching settings saved successfully" }
  } catch (error) {
    console.error("Error saving matching settings:", error)
    return { success: false, message: "Failed to save matching settings" }
  }
}

// Get available campaign fields
export async function getCampaignFields(): Promise<string[]> {
  try {
    // This would typically query your database schema
    // For now, returning common campaign fields
    return [
      "id",
      "campaign_id",
      "name",
      "description",
      "genre",
      "subgenre",
      "language",
      "vocal_type",
      "mood",
      "era",
      "tempo",
      "tier",
      "status",
      "created_at",
      "updated_at",
    ]
  } catch (error) {
    console.error("Error fetching campaign fields:", error)
    return []
  }
}

// Get available playlist fields
export async function getPlaylistFields(): Promise<string[]> {
  try {
    // This would typically query your database schema
    // For now, returning common playlist fields
    return [
      "id",
      "name",
      "description",
      "spotify_id",
      "spotify_url",
      "genre",
      "subgenre",
      "language",
      "vocal_type",
      "mood",
      "era",
      "tempo",
      "tier",
      "followers",
      "curator_id",
      "created_at",
      "updated_at",
    ]
  } catch (error) {
    console.error("Error fetching playlist fields:", error)
    return []
  }
}

// Get all campaigns for the test match dropdown
export async function getTestCampaigns(): Promise<{ id: number; name: string }[]> {
  try {
    const campaigns = await getAllCampaigns()
    return campaigns.map((campaign) => ({
      id: campaign.campaign_id,
      name: campaign.track_name || `Campaign #${campaign.campaign_id}`,
    }))
  } catch (error) {
    console.error("Error fetching test campaigns:", error)
    return []
  }
}

// Run a test match for a specific campaign
export async function runTestMatch(
  campaignId: number,
  settings?: MatchingSettings,
): Promise<{ success: boolean; message: string; results?: MatchResult[] }> {
  try {
    // Get the campaign
    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      return { success: false, message: "Campaign not found" }
    }

    // Get all playlists
    const playlists = await getAllPlaylists()
    if (!playlists || playlists.length === 0) {
      return { success: false, message: "No playlists available for matching" }
    }

    // Get matching settings if not provided
    if (!settings) {
      settings = await getMatchingSettings()
    }

    // Run the match
    const results = await matchCampaignToPlaylists(campaign, playlists, settings)

    // Return the top 5 results
    return {
      success: true,
      message: `Found ${results.length} potential matches`,
      results: results.slice(0, 5),
    }
  } catch (error) {
    console.error("Error running test match:", error)
    return { success: false, message: "An error occurred while running the test match" }
  }
}
