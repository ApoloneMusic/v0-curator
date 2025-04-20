"use server"

import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import {
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  getPlaylistById,
  getPlaylistsByCurator,
  playlistSchema,
} from "@/lib/playlists"
import { getPlaylistDetails } from "@/lib/spotify-api"

// Function to add a playlist from Spotify with improved error handling
export async function addSpotifyPlaylist(prevState: any, formData: FormData) {
  console.log("addSpotifyPlaylist called with formData:", Object.fromEntries(formData.entries()))

  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      console.error("User not authenticated")
      return {
        success: false,
        error: { _form: ["You must be logged in to add a playlist"] },
      }
    }

    // Extract form data
    const spotifyId = formData.get("spotifyId") as string

    if (!spotifyId) {
      console.error("Missing Spotify playlist ID")
      return {
        success: false,
        error: { _form: ["Missing Spotify playlist ID"] },
      }
    }

    const primaryGenre = formData.get("primaryGenre") as string
    const subgenres = formData.getAll("subgenres") as string[]
    const moods = formData.getAll("moods") as string[]
    const tempos = formData.getAll("tempos") as string[]
    const vocal = formData.get("vocal") as string
    const eras = formData.getAll("eras") as string[]
    const language = formData.get("language") as string

    // Validate required fields
    if (!primaryGenre || !vocal || !language) {
      console.error("Missing required fields", { primaryGenre, vocal, language })
      return {
        success: false,
        error: { _form: ["Please fill in all required fields"] },
      }
    }

    // Validate at least one subgenre is selected
    if (subgenres.length === 0) {
      console.error("No subgenres selected")
      return {
        success: false,
        error: { subgenres: ["Please select at least one subgenre"] },
      }
    }

    console.log(`Getting details for Spotify playlist: ${spotifyId}`)

    // Get playlist details from Spotify with retry logic
    let spotifyPlaylist = null
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        spotifyPlaylist = await getPlaylistDetails(spotifyId)
        break
      } catch (error: any) {
        console.error(`Attempt ${retryCount + 1} failed:`, error)
        retryCount++

        if (retryCount >= maxRetries) {
          return {
            success: false,
            error: {
              _form: [
                `Failed to get Spotify playlist details after ${maxRetries} attempts: ${error.message || "Unknown error"}`,
              ],
            },
          }
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
      }
    }

    if (!spotifyPlaylist || !spotifyPlaylist.external_urls?.spotify) {
      console.error("Failed to get valid playlist details from Spotify", spotifyPlaylist)
      return {
        success: false,
        error: { _form: ["Failed to get valid playlist details from Spotify"] },
      }
    }

    // Create playlist data object
    const playlistData = {
      spotifyLink: spotifyPlaylist.external_urls.spotify,
      followers: spotifyPlaylist.followers?.total || 0,
      primaryGenre,
      subgenres,
      moods,
      tempos,
      vocal,
      eras,
      language,
    }

    console.log("Creating playlist with data:", playlistData)

    // Validate input
    try {
      playlistSchema.parse(playlistData)
    } catch (error) {
      console.error("Validation error:", error)
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.flatten().fieldErrors,
        }
      }
      throw error
    }

    // Check if playlist already exists
    const existingPlaylists = await getPlaylistsByCurator(user.id)
    const playlistExists = existingPlaylists.some((p) => p.spotifyLink === playlistData.spotifyLink)

    if (playlistExists) {
      console.error("Playlist already exists in user's collection")
      return {
        success: false,
        error: { _form: ["This playlist is already in your collection"] },
      }
    }

    // Create playlist with timeout handling
    let playlist = null
    try {
      // Set a timeout for the database operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Database operation timed out")), 10000)
      })

      // Create the playlist
      const createPromise = createPlaylist(user.id, playlistData)

      // Race the promises
      playlist = await Promise.race([createPromise, timeoutPromise])
    } catch (error: any) {
      console.error("Error creating playlist:", error)
      return {
        success: false,
        error: { _form: [`Failed to create playlist: ${error.message || "Unknown error"}`] },
      }
    }

    if (!playlist) {
      console.error("Failed to create playlist in database")
      return {
        success: false,
        error: { _form: ["Failed to create playlist in database"] },
      }
    }

    console.log("Playlist created successfully:", playlist)
    return {
      success: true,
      message: "Playlist added successfully",
      playlist,
    }
  } catch (error: any) {
    console.error("Error adding Spotify playlist:", error)
    return {
      success: false,
      error: { _form: [`An unexpected error occurred: ${error.message || "Unknown error"}`] },
    }
  }
}

// Function to add a new playlist
export async function addPlaylist(prevState: any, formData: FormData) {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: { _form: ["You must be logged in to add a playlist"] },
      }
    }

    // Extract form data
    const spotifyLink = formData.get("spotifyLink") as string
    const followers = Number(formData.get("followers"))
    const primaryGenre = formData.get("primaryGenre") as string
    const subgenres = formData.getAll("subgenres") as string[]
    const moods = formData.getAll("moods") as string[]
    const tempos = formData.getAll("tempos") as string[]
    const vocal = formData.get("vocal") as string
    const eras = formData.getAll("eras") as string[]
    const language = formData.get("language") as string

    // Create playlist data object
    const playlistData = {
      spotifyLink,
      followers,
      primaryGenre,
      subgenres,
      moods,
      tempos,
      vocal,
      eras,
      language,
    }

    // Validate input
    const result = playlistSchema.safeParse(playlistData)
    if (!result.success) {
      return {
        success: false,
        error: result.error.flatten().fieldErrors,
      }
    }

    // Create playlist
    const playlist = await createPlaylist(user.id, playlistData)

    if (!playlist) {
      return {
        success: false,
        error: { _form: ["Failed to create playlist"] },
      }
    }

    return {
      success: true,
      message: "Playlist added successfully",
      playlist,
    }
  } catch (error) {
    console.error("Error adding playlist:", error)
    return {
      success: false,
      error: { _form: ["An unexpected error occurred. Please try again."] },
    }
  }
}

// Function to edit an existing playlist
export async function editPlaylist(playlistId: string, prevState: any, formData: FormData) {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: { _form: ["You must be logged in to edit a playlist"] },
      }
    }

    // Get the playlist
    const playlist = await getPlaylistById(playlistId)
    if (!playlist) {
      return {
        success: false,
        error: { _form: ["Playlist not found"] },
      }
    }

    // Check if user owns the playlist
    if (playlist.owner !== user.id) {
      return {
        success: false,
        error: { _form: ["You don't have permission to edit this playlist"] },
      }
    }

    // Extract form data
    const spotifyLink = formData.get("spotifyLink") as string
    const followers = Number(formData.get("followers"))
    const primaryGenre = formData.get("primaryGenre") as string
    const subgenres = formData.getAll("subgenres") as string[]
    const moods = formData.getAll("moods") as string[]
    const tempos = formData.getAll("tempos") as string[]
    const vocal = formData.get("vocal") as string
    const eras = formData.getAll("eras") as string[]
    const language = formData.get("language") as string

    // Create playlist data object
    const playlistData = {
      spotifyLink,
      followers,
      primaryGenre,
      subgenres,
      moods,
      tempos,
      vocal,
      eras,
      language,
    }

    // Validate input
    const result = playlistSchema.safeParse(playlistData)
    if (!result.success) {
      return {
        success: false,
        error: result.error.flatten().fieldErrors,
      }
    }

    // Update playlist
    const updatedPlaylist = await updatePlaylist(playlistId, playlistData)

    if (!updatedPlaylist) {
      return {
        success: false,
        error: { _form: ["Failed to update playlist"] },
      }
    }

    return {
      success: true,
      message: "Playlist updated successfully",
      playlist: updatedPlaylist,
    }
  } catch (error) {
    console.error("Error updating playlist:", error)
    return {
      success: false,
      error: { _form: ["An unexpected error occurred. Please try again."] },
    }
  }
}

// Function to get all playlists for the current user
export async function getCurrentUserPlaylists() {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to view your playlists",
      }
    }

    // Get playlists for curator
    const playlists = await getPlaylistsByCurator(user.id)

    return {
      success: true,
      playlists,
    }
  } catch (error) {
    console.error("Error getting current user playlists:", error)
    return {
      success: false,
      error: "Failed to load playlists",
    }
  }
}

// Function to remove a playlist
export async function removePlaylist(playlistId: string) {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to delete a playlist",
      }
    }

    // Delete playlist
    const success = await deletePlaylist(playlistId)

    if (!success) {
      return {
        success: false,
        error: "Failed to delete playlist",
      }
    }

    return {
      success: true,
      message: "Playlist deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting playlist:", error)
    return {
      success: false,
      error: "Failed to delete playlist",
    }
  }
}
