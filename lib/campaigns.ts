import { kv } from "@vercel/kv"
import { z } from "zod"

// Campaign status options
export const CAMPAIGN_STATUSES = ["order", "match", "pitch", "accepted", "declined", "placed", "closed"] as const

// Campaign type definition
export type Campaign = {
  campaign_id: number
  date_created: number // Unix timestamp
  client_id: string
  campaign_type: string
  track_name: string
  track_link: string
  track_popularity: number
  artist_popularity: number
  artist_followers: number
  release_date: number | null
  genre: string
  subgenre: string
  mood: string
  language: string
  vocal: string
  pitches: number
  status: (typeof CAMPAIGN_STATUSES)[number]
  matches: number
  matched_playlists: string[] // Array of playlist IDs
  accepted: number
  declined: number
}

// Validation schema for campaign data
export const campaignSchema = z.object({
  campaign_type: z.string().min(1, "Campaign type is required"),
  track_name: z.string().min(1, "Track name is required"),
  track_link: z.string().url("Please enter a valid track URL"),
  track_popularity: z.number().int().nonnegative("Track popularity must be a non-negative integer"),
  artist_popularity: z.number().int().nonnegative("Artist popularity must be a non-negative integer"),
  artist_followers: z.number().int().nonnegative("Artist followers must be a non-negative integer"),
  release_date: z.number().nullable(),
  genre: z.string().min(1, "Genre is required"),
  subgenre: z.string().min(1, "Subgenre is required"),
  mood: z.string().min(1, "Mood is required"),
  language: z.string().min(1, "Language is required"),
  vocal: z.string().min(1, "Vocal is required"),
  pitches: z.number().int().nonnegative("Pitches must be a non-negative integer"),
  status: z.enum(CAMPAIGN_STATUSES, {
    errorMap: () => ({ message: "Please select a valid status" }),
  }),
  matches: z.number().int().nonnegative("Matches must be a non-negative integer"),
  matched_playlists: z.array(z.string()),
  accepted: z.number().int().nonnegative("Accepted must be a non-negative integer"),
  declined: z.number().int().nonnegative("Declined must be a non-negative integer"),
})

// Function to get the next campaign ID
async function getNextCampaignId(): Promise<number> {
  // Increment the counter and return the new value
  // Starting from 1000 if it doesn't exist yet
  const nextId = await kv.incr("campaign:id:counter")

  // If this is the first campaign, set the counter to 1000
  if (nextId === 1) {
    await kv.set("campaign:id:counter", 1000)
    return 1000
  }

  return nextId
}

// Function to create a new campaign
export async function createCampaign(
  clientId: string,
  campaignData: Omit<Campaign, "campaign_id" | "date_created" | "client_id">,
): Promise<Campaign | null> {
  try {
    // Get the next campaign ID
    const campaignId = await getNextCampaignId()
    const dateCreated = Date.now()

    // Create the campaign object
    const campaign: Campaign = {
      campaign_id: campaignId,
      date_created: dateCreated,
      client_id: clientId,
      ...campaignData,
    }

    // Store the campaign in Redis
    await kv.hset(`campaign:${campaignId}`, campaign)

    // Add to client's campaigns set
    await kv.sadd(`client:${clientId}:campaigns`, campaignId.toString())

    // Add to status index
    await kv.sadd(`campaigns:status:${campaign.status}`, campaignId.toString())

    // Add to sorted set by date for easy retrieval of recent campaigns
    await kv.zadd("campaigns:by:date", { score: dateCreated, member: campaignId.toString() })

    return campaign
  } catch (error) {
    console.error("Error creating campaign:", error)
    return null
  }
}

// Function to update an existing campaign
export async function updateCampaign(
  campaignId: number,
  campaignData: Partial<Omit<Campaign, "campaign_id" | "date_created" | "client_id">>,
): Promise<Campaign | null> {
  try {
    // Fetch existing campaign
    const existingCampaign = await getCampaignById(campaignId)
    if (!existingCampaign) {
      console.error("Campaign not found:", campaignId)
      return null
    }

    // Create updated campaign object
    const updatedCampaign: Campaign = {
      ...existingCampaign,
      ...campaignData,
    }

    // If status changed, update status indexes
    if (campaignData.status && campaignData.status !== existingCampaign.status) {
      await kv.srem(`campaigns:status:${existingCampaign.status}`, campaignId.toString())
      await kv.sadd(`campaigns:status:${campaignData.status}`, campaignId.toString())
    }

    // Store the updated campaign
    await kv.hset(`campaign:${campaignId}`, updatedCampaign)

    return updatedCampaign
  } catch (error) {
    console.error("Error updating campaign:", error)
    return null
  }
}

// Function to delete a campaign
export async function deleteCampaign(campaignId: number): Promise<boolean> {
  try {
    // Fetch existing campaign
    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      console.error("Campaign not found:", campaignId)
      return false
    }

    // Remove from client's campaigns set
    await kv.srem(`client:${campaign.client_id}:campaigns`, campaignId.toString())

    // Remove from status index
    await kv.srem(`campaigns:status:${campaign.status}`, campaignId.toString())

    // Remove from date sorted set
    await kv.zrem("campaigns:by:date", campaignId.toString())

    // Delete the campaign
    await kv.del(`campaign:${campaignId}`)

    return true
  } catch (error) {
    console.error("Error deleting campaign:", error)
    return false
  }
}

// Function to get a campaign by ID
export async function getCampaignById(campaignId: number): Promise<Campaign | null> {
  try {
    const campaign = await kv.hgetall<Campaign>(`campaign:${campaignId}`)

    if (!campaign) {
      console.warn("Campaign not found:", campaignId)
      return null
    }

    return campaign
  } catch (error) {
    console.error("Error getting campaign by ID:", error)
    return null
  }
}

// Function to get all campaigns
export async function getAllCampaigns(): Promise<Campaign[]> {
  try {
    // Get all campaign IDs from the date index
    const campaignIds = await kv.zrange("campaigns:by:date", 0, -1)
    if (!campaignIds || campaignIds.length === 0) return []

    const campaigns: Campaign[] = []
    for (const id of campaignIds) {
      const campaign = await getCampaignById(Number.parseInt(id))
      if (campaign) {
        campaigns.push(campaign)
      }
    }

    return campaigns
  } catch (error) {
    console.error("Error getting all campaigns:", error)
    return []
  }
}

// Function to get all campaigns for a client
export async function getCampaignsByClient(clientId: string): Promise<Campaign[]> {
  try {
    const campaignIds = await kv.smembers(`client:${clientId}:campaigns`)
    if (!campaignIds || campaignIds.length === 0) return []

    const campaigns: Campaign[] = []
    for (const id of campaignIds) {
      const campaign = await getCampaignById(Number.parseInt(id))
      if (campaign) {
        campaigns.push(campaign)
      }
    }

    return campaigns
  } catch (error) {
    console.error("Error getting campaigns by client:", error)
    return []
  }
}

// Function to get campaigns by status
export async function getCampaignsByStatus(status: (typeof CAMPAIGN_STATUSES)[number]): Promise<Campaign[]> {
  try {
    const campaignIds = await kv.smembers(`campaigns:status:${status}`)
    if (!campaignIds || campaignIds.length === 0) return []

    const campaigns: Campaign[] = []
    for (const id of campaignIds) {
      const campaign = await getCampaignById(Number.parseInt(id))
      if (campaign) {
        campaigns.push(campaign)
      }
    }

    return campaigns
  } catch (error) {
    console.error("Error getting campaigns by status:", error)
    return []
  }
}

// Function to get recent campaigns
export async function getRecentCampaigns(limit = 10): Promise<Campaign[]> {
  try {
    // Get the most recent campaign IDs from the sorted set
    const campaignIds = await kv.zrange("campaigns:by:date", -limit, -1, { rev: true })
    if (!campaignIds || campaignIds.length === 0) return []

    const campaigns: Campaign[] = []
    for (const id of campaignIds) {
      const campaign = await getCampaignById(Number.parseInt(id))
      if (campaign) {
        campaigns.push(campaign)
      }
    }

    return campaigns
  } catch (error) {
    console.error("Error getting recent campaigns:", error)
    return []
  }
}

// Function to add a playlist to a campaign's matched_playlists
export async function addPlaylistToCampaign(campaignId: number, playlistId: string): Promise<boolean> {
  try {
    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      console.error("Campaign not found:", campaignId)
      return false
    }

    // Check if playlist is already matched
    if (campaign.matched_playlists.includes(playlistId)) {
      return true // Already matched, no action needed
    }

    // Add playlist to matched_playlists
    const updatedPlaylists = [...campaign.matched_playlists, playlistId]

    // Update campaign with new matched_playlists and increment matches count
    await updateCampaign(campaignId, {
      matched_playlists: updatedPlaylists,
      matches: campaign.matches + 1,
    })

    return true
  } catch (error) {
    console.error("Error adding playlist to campaign:", error)
    return false
  }
}

// Function to remove a playlist from a campaign's matched_playlists
export async function removePlaylistFromCampaign(campaignId: number, playlistId: string): Promise<boolean> {
  try {
    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      console.error("Campaign not found:", campaignId)
      return false
    }

    // Check if playlist is matched
    if (!campaign.matched_playlists.includes(playlistId)) {
      return true // Not matched, no action needed
    }

    // Remove playlist from matched_playlists
    const updatedPlaylists = campaign.matched_playlists.filter((id) => id !== playlistId)

    // Update campaign with new matched_playlists and decrement matches count
    await updateCampaign(campaignId, {
      matched_playlists: updatedPlaylists,
      matches: Math.max(0, campaign.matches - 1),
    })

    return true
  } catch (error) {
    console.error("Error removing playlist from campaign:", error)
    return false
  }
}
