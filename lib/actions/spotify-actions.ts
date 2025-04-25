"use server"

import { findSpotifyUsers, getUserPlaylists, getPlaylistDetails, getUserProfile } from "@/lib/spotify-api"
import { getCurrentUser } from "@/lib/auth"

// Search for Spotify users with enhanced matching
export async function searchSpotifyUsers(query: string, limit = 10, offset = 0) {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to search users",
      }
    }

    if (!query.trim()) {
      return {
        success: false,
        error: "Search query cannot be empty",
      }
    }

    // Search for users with enhanced matching
    try {
      console.log(`Searching for Spotify users with query: "${query}"`)
      const result = await findSpotifyUsers(query, limit, offset)

      // Ensure we have valid users data
      if (!result || !Array.isArray(result.users)) {
        console.error("Invalid response structure:", result)
        return {
          success: false,
          error: "Invalid response from Spotify API",
        }
      }

      // Process users to ensure they have all required fields
      const processedUsers = result.users
        .filter((user) => user !== null && user !== undefined)
        .map((user) => ({
          id: user.id || "",
          display_name: user.display_name || "Unknown User",
          external_urls: user.external_urls || { spotify: "" },
          images: Array.isArray(user.images) ? user.images : [],
          followers: user.followers || { total: 0 },
        }))

      return {
        success: true,
        users: processedUsers,
        total: result.total,
        offset: result.offset,
        limit: result.limit,
        next: result.next,
        previous: result.previous,
      }
    } catch (error: any) {
      console.error("Spotify API error:", error)
      return {
        success: false,
        error: `Spotify API error: ${error.message || "Unknown error"}`,
      }
    }
  } catch (error: any) {
    console.error("Error searching Spotify users:", error)
    return {
      success: false,
      error: `Failed to search Spotify users: ${error.message || "Unknown error"}`,
    }
  }
}

// Get playlists for a Spotify user
export async function getSpotifyUserPlaylists(userId: string, limit = 50, offset = 0) {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to get user playlists",
      }
    }

    // Validate userId
    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        error: "Invalid Spotify user ID",
      }
    }

    // Extract user ID from URL if needed
    const extractedId = extractUserIdFromInput(userId)
    if (!extractedId) {
      return {
        success: false,
        error: "Could not extract a valid Spotify user ID",
      }
    }

    // Get user playlists
    try {
      console.log("Getting playlists for Spotify user:", extractedId)
      const result = await getUserPlaylists(extractedId, limit, offset)

      // Ensure we have valid playlists data
      if (!result || !Array.isArray(result.items)) {
        console.error("Invalid response structure:", result)
        return {
          success: false,
          error: "Invalid response from Spotify API",
        }
      }

      // Process playlists to ensure they have all required fields
      const processedPlaylists = result.items
        .filter((playlist) => playlist !== null && playlist !== undefined)
        .map((playlist) => ({
          id: playlist.id || "",
          name: playlist.name || "Untitled Playlist",
          external_urls: playlist.external_urls || { spotify: "" },
          images: Array.isArray(playlist.images) ? playlist.images : [],
          owner: playlist.owner || { display_name: "Unknown", id: "" },
          tracks: playlist.tracks || { total: 0 },
          followers: playlist.followers || { total: 0 },
        }))

      return {
        success: true,
        playlists: processedPlaylists,
        total: result.total,
        offset: result.offset,
        limit: result.limit,
        next: result.next,
        previous: result.previous,
      }
    } catch (error: any) {
      console.error("Spotify API error:", error)
      return {
        success: false,
        error: `Spotify API error: ${error.message || "Unknown error"}`,
      }
    }
  } catch (error: any) {
    console.error("Error getting Spotify user playlists:", error)
    return {
      success: false,
      error: `Failed to get Spotify user playlists: ${error.message || "Unknown error"}`,
    }
  }
}

// Get playlist details from Spotify
export async function getSpotifyPlaylistDetails(playlistId: string) {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to get playlist details",
      }
    }

    // Get playlist details
    try {
      const playlist = await getPlaylistDetails(playlistId)

      return {
        success: true,
        playlist,
      }
    } catch (error: any) {
      console.error("Spotify API error:", error)
      return {
        success: false,
        error: `Spotify API error: ${error.message || "Unknown error"}`,
      }
    }
  } catch (error: any) {
    console.error("Error getting Spotify playlist details:", error)
    return {
      success: false,
      error: `Failed to get Spotify playlist details: ${error.message || "Unknown error"}`,
    }
  }
}

// Get user profile
export async function getSpotifyUserProfile(userId: string) {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to get user profile",
      }
    }

    // Validate userId
    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        error: "Invalid Spotify user ID",
      }
    }

    // Extract user ID from URL if needed
    const extractedId = extractUserIdFromInput(userId)
    if (!extractedId) {
      return {
        success: false,
        error: "Could not extract a valid Spotify user ID",
      }
    }

    // Get user profile
    try {
      console.log("Getting user profile for:", extractedId)
      const profile = await getUserProfile(extractedId)

      return {
        success: true,
        profile,
      }
    } catch (error: any) {
      console.error("Spotify API error:", error)
      return {
        success: false,
        error: `Spotify API error: ${error.message || "Unknown error"}`,
      }
    }
  } catch (error: any) {
    console.error("Error getting Spotify user profile:", error)
    return {
      success: false,
      error: `Failed to get Spotify user profile: ${error.message || "Unknown error"}`,
    }
  }
}

// Helper function to extract user ID from various input formats
function extractUserIdFromInput(input: string): string | null {
  try {
    // Clean up the input
    const trimmedInput = input.trim()

    // Check for Spotify URI format: spotify:user:username
    const uriMatch = trimmedInput.match(/spotify:user:([a-zA-Z0-9_-]+)/)
    if (uriMatch) {
      return uriMatch[1]
    }

    // Check for Spotify URL format: https://open.spotify.com/user/username
    const urlMatch = trimmedInput.match(/spotify\.com\/user\/([a-zA-Z0-9_-]+)/)
    if (urlMatch) {
      // Remove any query parameters
      return urlMatch[1].split("?")[0]
    }

    // If it's just a username without URL/URI format, return as is
    if (/^[a-zA-Z0-9_-]+$/.test(trimmedInput)) {
      return trimmedInput
    }

    return null
  } catch (error) {
    console.error("Error extracting user ID:", error)
    return null
  }
}
