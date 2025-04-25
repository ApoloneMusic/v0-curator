import type { Campaign } from "./campaigns"
import type { Playlist } from "./playlists"
import { type Pitch, createPitch } from "./pitches"
import { type MatchingSettings, type TierGapAttribute, getMatchingSettings } from "./actions/matching-actions"

export interface MatchResult {
  playlist: Playlist
  score: number
  breakdown: {
    attributeId: string
    attributeName: string
    points: number
    matched: boolean
    required: boolean
    campaignValue?: any
    playlistValue?: any
  }[]
  totalPossiblePoints: number
}

export async function matchCampaignToPlaylists(
  campaign: Campaign,
  playlists: Playlist[],
  settings?: MatchingSettings,
): Promise<MatchResult[]> {
  // Get matching settings if not provided
  if (!settings) {
    settings = await getMatchingSettings()
  }

  const results: MatchResult[] = []

  // Calculate match score for each playlist
  for (const playlist of playlists) {
    const result = calculateMatchScore(campaign, playlist, settings)
    results.push(result)
  }

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score)

  return results
}

export function calculateMatchScore(campaign: Campaign, playlist: Playlist, settings: MatchingSettings): MatchResult {
  const breakdown: MatchResult["breakdown"] = []
  let score = 0
  let totalPossiblePoints = 0

  // Check each attribute in the matching settings
  for (const attribute of settings.attributes) {
    const campaignValue = getCampaignValue(campaign, attribute.sourceCampaign)
    const playlistValue = getPlaylistValue(playlist, attribute.sourcePlaylist)

    // Calculate if values match
    let matched = false

    if (attribute.id === "tier_gap" && "maxDifference" in attribute) {
      // Special handling for tier gap
      const tierGapAttribute = attribute as TierGapAttribute
      const campaignTier = Number(campaignValue) || 0
      const playlistTier = Number(playlistValue) || 0

      // Check if the difference is within the allowed range
      const difference = Math.abs(campaignTier - playlistTier)
      matched = difference <= tierGapAttribute.maxDifference
    } else {
      // Standard equality check for other attributes
      matched = isMatch(campaignValue, playlistValue)
    }

    // Add to total possible points
    totalPossiblePoints += attribute.points

    // If required and not matched, score is 0
    if (attribute.required && !matched) {
      breakdown.push({
        attributeId: attribute.id,
        attributeName: attribute.name,
        points: 0,
        matched: false,
        required: attribute.required,
        campaignValue,
        playlistValue,
      })
      continue
    }

    // Add points if matched
    if (matched) {
      score += attribute.points
      breakdown.push({
        attributeId: attribute.id,
        attributeName: attribute.name,
        points: attribute.points,
        matched: true,
        required: attribute.required,
        campaignValue,
        playlistValue,
      })
    } else {
      breakdown.push({
        attributeId: attribute.id,
        attributeName: attribute.name,
        points: 0,
        matched: false,
        required: attribute.required,
        campaignValue,
        playlistValue,
      })
    }
  }

  return {
    playlist,
    score,
    breakdown,
    totalPossiblePoints,
  }
}

// Helper function to get a value from a campaign using a field path
function getCampaignValue(campaign: Campaign, fieldPath: string): any {
  return getNestedValue(campaign, fieldPath)
}

// Helper function to get a value from a playlist using a field path
function getPlaylistValue(playlist: Playlist, fieldPath: string): any {
  return getNestedValue(playlist, fieldPath)
}

// Helper function to get a nested value from an object using a field path
function getNestedValue(obj: any, fieldPath: string): any {
  if (!fieldPath) return undefined

  const parts = fieldPath.split(".")
  let value = obj

  for (const part of parts) {
    if (value === null || value === undefined) return undefined
    value = value[part]
  }

  return value
}

// Helper function to check if two values match
function isMatch(value1: any, value2: any): boolean {
  // Handle arrays
  if (Array.isArray(value1) && Array.isArray(value2)) {
    // Check if arrays have at least one common element
    return value1.some((v1) => value2.includes(v1))
  }

  // Handle arrays with single values
  if (Array.isArray(value1) && !Array.isArray(value2)) {
    return value1.includes(value2)
  }

  if (!Array.isArray(value1) && Array.isArray(value2)) {
    return value2.includes(value1)
  }

  // Handle null/undefined
  if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) {
    return value1 === value2
  }

  // Convert to strings for comparison
  return String(value1).toLowerCase() === String(value2).toLowerCase()
}

// Function to automatically match a campaign with playlists and create pitches
export async function autoMatchCampaign(
  campaign: Campaign,
  playlists: Playlist[],
  settings?: MatchingSettings,
): Promise<{ success: boolean; message: string; pitches: Pitch[] }> {
  try {
    // Get the number of pitches required from the campaign
    const numPitchesRequired = campaign.pitches || 0

    if (numPitchesRequired <= 0) {
      return {
        success: false,
        message: "No pitches required for this campaign",
        pitches: [],
      }
    }

    // Match campaign to playlists
    const matchResults = await matchCampaignToPlaylists(campaign, playlists, settings)

    // Filter out any playlists that don't match required attributes
    const validMatches = matchResults.filter((result) => {
      // Check if all required attributes are matched
      return !result.breakdown.some((item) => item.required && !item.matched)
    })

    if (validMatches.length === 0) {
      return {
        success: false,
        message: "No matching playlists found",
        pitches: [],
      }
    }

    // Take the top N matches based on numPitchesRequired
    const topMatches = validMatches.slice(0, numPitchesRequired)

    // Create pitches for each match
    const pitches: Pitch[] = []

    for (const match of topMatches) {
      const pitch = await createPitch({
        campaign_id: campaign.campaign_id,
        client_id: campaign.client_id,
        track_link: campaign.track_link || "",
        playlist_id: match.playlist.id,
        status: "matched",
      })

      if (pitch) {
        pitches.push(pitch)
      }
    }

    // Update campaign with the number of matches
    // This would typically be done in the campaign-actions.ts file

    return {
      success: true,
      message: `Successfully matched campaign with ${pitches.length} playlists`,
      pitches,
    }
  } catch (error) {
    console.error("Error in autoMatchCampaign:", error)
    return {
      success: false,
      message: "An error occurred during automatic matching",
      pitches: [],
    }
  }
}
