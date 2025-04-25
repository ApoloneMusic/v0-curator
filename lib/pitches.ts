import { z } from "zod"
import { kv } from "@vercel/kv"

// Pitch status options
export const PITCH_STATUSES = ["matched", "pitched", "accepted", "declined", "expired"] as const

// Pitch type definition
export type Pitch = {
  pitch_id: number
  campaign_id: number
  client_id: string
  track_link: string
  playlist_id: string
  status: (typeof PITCH_STATUSES)[number]
  placement_date?: number // Unix timestamp
  placement_duration?: number // Duration in days
  created_at: number // Unix timestamp
  updated_at: number // Unix timestamp
}

// Validation schema for pitch data
export const pitchSchema = z.object({
  campaign_id: z.number().int().positive("Campaign ID is required"),
  client_id: z.string().min(1, "Client ID is required"),
  track_link: z.string().url("Please enter a valid track URL"),
  playlist_id: z.string().min(1, "Playlist ID is required"),
  status: z.enum(PITCH_STATUSES, {
    errorMap: () => ({ message: "Please select a valid status" }),
  }),
  placement_date: z.number().optional(),
  placement_duration: z.number().int().nonnegative().optional(),
})

// Function to get the next pitch ID
async function getNextPitchId(): Promise<number> {
  // Increment the counter and return the new value
  // Starting from 1000 if it doesn't exist yet
  const nextId = await kv.incr("pitch:id:counter")

  // If this is the first pitch, set the counter to 1000
  if (nextId === 1) {
    await kv.set("pitch:id:counter", 1000)
    return 1000
  }

  return nextId
}

// Function to create a new pitch
export async function createPitch(
  pitchData: Omit<Pitch, "pitch_id" | "created_at" | "updated_at">,
): Promise<Pitch | null> {
  try {
    // Get the next pitch ID
    const pitchId = await getNextPitchId()
    const timestamp = Date.now()

    // Create the pitch object
    const pitch: Pitch = {
      pitch_id: pitchId,
      ...pitchData,
      created_at: timestamp,
      updated_at: timestamp,
    }

    // Store the pitch in Redis
    await kv.hset(`pitch:${pitchId}`, pitch)

    // Add to campaign's pitches set
    await kv.sadd(`campaign:${pitchData.campaign_id}:pitches`, pitchId.toString())

    // Add to client's pitches set
    await kv.sadd(`client:${pitchData.client_id}:pitches`, pitchId.toString())

    // Add to playlist's pitches set
    await kv.sadd(`playlist:${pitchData.playlist_id}:pitches`, pitchId.toString())

    // Add to status index
    await kv.sadd(`pitches:status:${pitchData.status}`, pitchId.toString())

    // Add to sorted set by creation date for easy retrieval of recent pitches
    await kv.zadd("pitches:by:date", { score: timestamp, member: pitchId.toString() })

    return pitch
  } catch (error) {
    console.error("Error creating pitch:", error)
    return null
  }
}

// Function to update an existing pitch
export async function updatePitch(
  pitchId: number,
  pitchData: Partial<Omit<Pitch, "pitch_id" | "created_at" | "updated_at">>,
): Promise<Pitch | null> {
  try {
    // Fetch existing pitch
    const existingPitch = await getPitchById(pitchId)
    if (!existingPitch) {
      console.error("Pitch not found:", pitchId)
      return null
    }

    // Create updated pitch object
    const updatedPitch: Pitch = {
      ...existingPitch,
      ...pitchData,
      updated_at: Date.now(),
    }

    // If status changed, update status indexes
    if (pitchData.status && pitchData.status !== existingPitch.status) {
      await kv.srem(`pitches:status:${existingPitch.status}`, pitchId.toString())
      await kv.sadd(`pitches:status:${pitchData.status}`, pitchId.toString())
    }

    // If campaign_id changed, update campaign indexes
    if (pitchData.campaign_id && pitchData.campaign_id !== existingPitch.campaign_id) {
      await kv.srem(`campaign:${existingPitch.campaign_id}:pitches`, pitchId.toString())
      await kv.sadd(`campaign:${pitchData.campaign_id}:pitches`, pitchId.toString())
    }

    // If client_id changed, update client indexes
    if (pitchData.client_id && pitchData.client_id !== existingPitch.client_id) {
      await kv.srem(`client:${existingPitch.client_id}:pitches`, pitchId.toString())
      await kv.sadd(`client:${pitchData.client_id}:pitches`, pitchId.toString())
    }

    // If playlist_id changed, update playlist indexes
    if (pitchData.playlist_id && pitchData.playlist_id !== existingPitch.playlist_id) {
      await kv.srem(`playlist:${existingPitch.playlist_id}:pitches`, pitchId.toString())
      await kv.sadd(`playlist:${pitchData.playlist_id}:pitches`, pitchId.toString())
    }

    // Store the updated pitch
    await kv.hset(`pitch:${pitchId}`, updatedPitch)

    return updatedPitch
  } catch (error) {
    console.error("Error updating pitch:", error)
    return null
  }
}

// Function to delete a pitch
export async function deletePitch(pitchId: number): Promise<boolean> {
  try {
    // Fetch existing pitch
    const pitch = await getPitchById(pitchId)
    if (!pitch) {
      console.error("Pitch not found:", pitchId)
      return false
    }

    // Remove from campaign's pitches set
    await kv.srem(`campaign:${pitch.campaign_id}:pitches`, pitchId.toString())

    // Remove from client's pitches set
    await kv.srem(`client:${pitch.client_id}:pitches`, pitchId.toString())

    // Remove from playlist's pitches set
    await kv.srem(`playlist:${pitch.playlist_id}:pitches`, pitchId.toString())

    // Remove from status index
    await kv.srem(`pitches:status:${pitch.status}`, pitchId.toString())

    // Remove from date sorted set
    await kv.zrem("pitches:by:date", pitchId.toString())

    // Delete the pitch
    await kv.del(`pitch:${pitchId}`)

    return true
  } catch (error) {
    console.error("Error deleting pitch:", error)
    return false
  }
}

// Function to get a pitch by ID
export async function getPitchById(pitchId: number): Promise<Pitch | null> {
  try {
    const pitch = await kv.hgetall<Pitch>(`pitch:${pitchId}`)

    if (!pitch) {
      console.warn("Pitch not found:", pitchId)
      return null
    }

    return pitch
  } catch (error) {
    console.error("Error getting pitch by ID:", error)
    return null
  }
}

// Function to get all pitches
export async function getAllPitches(): Promise<Pitch[]> {
  try {
    // Get all pitch IDs from the date index
    const pitchIds = await kv.zrange("pitches:by:date", 0, -1)
    if (!pitchIds || pitchIds.length === 0) return []

    const pitches: Pitch[] = []
    for (const id of pitchIds) {
      const pitch = await getPitchById(Number.parseInt(id))
      if (pitch) {
        pitches.push(pitch)
      }
    }

    return pitches
  } catch (error) {
    console.error("Error getting all pitches:", error)
    return []
  }
}

// Function to get all pitches for a campaign
export async function getPitchesByCampaign(campaignId: number): Promise<Pitch[]> {
  try {
    const pitchIds = await kv.smembers(`campaign:${campaignId}:pitches`)
    if (!pitchIds || pitchIds.length === 0) return []

    const pitches: Pitch[] = []
    for (const id of pitchIds) {
      const pitch = await getPitchById(Number.parseInt(id))
      if (pitch) {
        pitches.push(pitch)
      }
    }

    return pitches
  } catch (error) {
    console.error("Error getting pitches by campaign:", error)
    return []
  }
}

// Function to get all pitches for a client
export async function getPitchesByClient(clientId: string): Promise<Pitch[]> {
  try {
    const pitchIds = await kv.smembers(`client:${clientId}:pitches`)
    if (!pitchIds || pitchIds.length === 0) return []

    const pitches: Pitch[] = []
    for (const id of pitchIds) {
      const pitch = await getPitchById(Number.parseInt(id))
      if (pitch) {
        pitches.push(pitch)
      }
    }

    return pitches
  } catch (error) {
    console.error("Error getting pitches by client:", error)
    return []
  }
}

// Function to get all pitches for a playlist
export async function getPitchesByPlaylist(playlistId: string): Promise<Pitch[]> {
  try {
    const pitchIds = await kv.smembers(`playlist:${playlistId}:pitches`)
    if (!pitchIds || pitchIds.length === 0) return []

    const pitches: Pitch[] = []
    for (const id of pitchIds) {
      const pitch = await getPitchById(Number.parseInt(id))
      if (pitch) {
        pitches.push(pitch)
      }
    }

    return pitches
  } catch (error) {
    console.error("Error getting pitches by playlist:", error)
    return []
  }
}

// Function to get pitches by status
export async function getPitchesByStatus(status: (typeof PITCH_STATUSES)[number]): Promise<Pitch[]> {
  try {
    const pitchIds = await kv.smembers(`pitches:status:${status}`)
    if (!pitchIds || pitchIds.length === 0) return []

    const pitches: Pitch[] = []
    for (const id of pitchIds) {
      const pitch = await getPitchById(Number.parseInt(id))
      if (pitch) {
        pitches.push(pitch)
      }
    }

    return pitches
  } catch (error) {
    console.error("Error getting pitches by status:", error)
    return []
  }
}

// Function to get recent pitches
export async function getRecentPitches(limit = 10): Promise<Pitch[]> {
  try {
    // Get the most recent pitch IDs from the sorted set
    const pitchIds = await kv.zrange("pitches:by:date", -limit, -1, { rev: true })
    if (!pitchIds || pitchIds.length === 0) return []

    const pitches: Pitch[] = []
    for (const id of pitchIds) {
      const pitch = await getPitchById(Number.parseInt(id))
      if (pitch) {
        pitches.push(pitch)
      }
    }

    return pitches
  } catch (error) {
    console.error("Error getting recent pitches:", error)
    return []
  }
}

// Function to get upcoming placements (pitches with future placement dates)
export async function getUpcomingPlacements(): Promise<Pitch[]> {
  try {
    // Get all pitches with status 'accepted'
    const acceptedPitches = await getPitchesByStatus("accepted")

    // Filter for pitches with future placement dates
    const now = Date.now()
    return acceptedPitches
      .filter((pitch) => pitch.placement_date && pitch.placement_date > now)
      .sort((a, b) => {
        // Sort by placement date (ascending)
        const dateA = a.placement_date || 0
        const dateB = b.placement_date || 0
        return dateA - dateB
      })
  } catch (error) {
    console.error("Error getting upcoming placements:", error)
    return []
  }
}

// Function to get active placements (pitches with current placement dates)
export async function getActivePlacements(): Promise<Pitch[]> {
  try {
    // Get all pitches with status 'accepted'
    const acceptedPitches = await getPitchesByStatus("accepted")

    // Filter for pitches with current placement dates
    const now = Date.now()
    return acceptedPitches.filter((pitch) => {
      if (!pitch.placement_date || !pitch.placement_duration) return false

      const endDate = pitch.placement_date + pitch.placement_duration * 24 * 60 * 60 * 1000
      return pitch.placement_date <= now && endDate >= now
    })
  } catch (error) {
    console.error("Error getting active placements:", error)
    return []
  }
}

// Function to create multiple pitches for a campaign
export async function createPitchesForCampaign(
  campaignId: number,
  clientId: string,
  trackLink: string,
  playlistIds: string[],
): Promise<{ success: boolean; count: number }> {
  try {
    let successCount = 0

    for (const playlistId of playlistIds) {
      const pitch = await createPitch({
        campaign_id: campaignId,
        client_id: clientId,
        track_link: trackLink,
        playlist_id: playlistId,
        status: "matched", // Initial status
      })

      if (pitch) successCount++
    }

    return {
      success: successCount > 0,
      count: successCount,
    }
  } catch (error) {
    console.error("Error creating pitches for campaign:", error)
    return { success: false, count: 0 }
  }
}
