"use server"

import { searchPlaylists, getPlaylistDetails } from "@/lib/spotify-api"
import { getCurrentUser } from "@/lib/auth"

// Search for playlists on Spotify
export async function searchSpotifyPlaylists(query: string, limit = 10, offset = 0) {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to search playlists",
      }
    }

    if (!query.trim()) {
      return {
        success: false,
        error: "Search query cannot be empty",
      }
    }

    // Search for playlists
    try {
      console.log("Searching Spotify for:", query)
      const result = await searchPlaylists(query, limit, offset)

      // Ensure we have valid playlists data
      if (!result || !result.playlists || !Array.isArray(result.playlists.items)) {
        console.error("Invalid response structure:", result)
        return {
          success: false,
          error: "Invalid response from Spotify API",
        }
      }

      // Process playlists to ensure they have all required fields
      const processedPlaylists = result.playlists.items
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
        total: result.playlists.total,
        offset: result.playlists.offset,
        limit: result.playlists.limit,
        next: result.playlists.next,
        previous: result.playlists.previous,
      }
    } catch (error: any) {
      console.error("Spotify API error:", error)
      return {
        success: false,
        error: `Spotify API error: ${error.message || "Unknown error"}`,
      }
    }
  } catch (error: any) {
    console.error("Error searching Spotify playlists:", error)
    return {
      success: false,
      error: `Failed to search Spotify playlists: ${error.message || "Unknown error"}`,
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
    const playlist = await getPlaylistDetails(playlistId)

    return {
      success: true,
      playlist,
    }
  } catch (error: any) {
    console.error("Error getting Spotify playlist details:", error)
    return {
      success: false,
      error: `Failed to get Spotify playlist details: ${error.message || "Unknown error"}`,
    }
  }
}
