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
  getAllPlaylists as getPlaylists,
  createDynamicPlaylistSchema,
} from "@/lib/playlists"
import { getPlaylistDetails } from "@/lib/spotify-api"
import { normalizeGenre, normalizeLanguage, normalizeVocal } from "@/lib/utils"

// Function to get all playlists (for admin use)
export async function getAllPlaylists(): Promise<any[]> {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return []
    }

    // If user is admin, get all playlists
    if (user.role === "admin") {
      return await getPlaylists()
    }

    // Otherwise, only return user's playlists
    return await getPlaylistsByCurator(user.id)
  } catch (error) {
    console.error("Error getting all playlists:", error)
    return []
  }
}

// Add a playlist from Spotify with improved error handling
export async function addSpotifyPlaylist(prevState: any, formData: FormData) {
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
    const name = formData.get("name") as string

    if (!spotifyId) {
      console.error("Missing Spotify playlist ID")
      return {
        success: false,
        error: { _form: ["Missing Spotify playlist ID"] },
      }
    }

    // Extract and normalize form data
    const primaryGenreRaw = formData.get("primaryGenre") as string
    const primaryGenre = await normalizeGenre(primaryGenreRaw)

    const subgenres = formData.getAll("subgenres") as string[]
    const moods = formData.getAll("moods") as string[]
    const tempos = formData.getAll("tempos") as string[]

    const vocalRaw = formData.get("vocal") as string
    const vocal = normalizeVocal(vocalRaw)

    const eras = formData.getAll("eras") as string[]

    const languageRaw = formData.get("language") as string
    const language = normalizeLanguage(languageRaw)

    console.log("Form data received:", {
      primaryGenreRaw,
      primaryGenre,
      vocalRaw,
      vocal,
      languageRaw,
      language,
      subgenres,
    })

    // Get followers count from form data or default to 0
    const followersStr = formData.get("followers") as string
    const followers = followersStr ? Number.parseInt(followersStr, 10) : 0

    console.log("Received followers count:", followers)

    // Validate required fields
    if (!primaryGenre || !vocal || !language) {
      console.error("Missing required fields", { primaryGenre, vocal, language })
      return {
        success: false,
        error: { _form: ["Please fill in all required fields"] },
      }
    }

    // Validate at least one mood is selected
    if (moods.length === 0) {
      console.error("No moods selected")
      return {
        success: false,
        error: { moods: ["Please select at least one mood"] },
      }
    }

    // Validate at least one era is selected
    if (eras.length === 0) {
      console.error("No eras selected")
      return {
        success: false,
        error: { eras: ["Please select at least one era"] },
      }
    }

    // Validate at least three subgenres are selected
    if (!subgenres || subgenres.length < 3) {
      console.error("Not enough subgenres selected")
      return {
        success: false,
        error: { subgenres: ["Please select at least 3 subgenres"] },
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

    // Extract playlist name if not provided
    let playlistName = name
    if (!playlistName && spotifyPlaylist.name) {
      playlistName = spotifyPlaylist.name
    }

    // Use followers count from Spotify API if available, otherwise use the one from form data
    const followerCount = spotifyPlaylist.followers?.total !== undefined ? spotifyPlaylist.followers.total : followers

    console.log(
      "Using follower count:",
      followerCount,
      "API value:",
      spotifyPlaylist.followers?.total,
      "Form value:",
      followers,
    )

    // Create playlist data object
    const playlistData = {
      name: playlistName,
      spotifyLink: spotifyPlaylist.external_urls.spotify,
      followers: followerCount,
      primaryGenre,
      subgenres,
      moods,
      tempos,
      vocal,
      eras,
      language,
    }

    console.log("Creating playlist with data:", playlistData)

    // Validate input using dynamic schema
    try {
      // First try with dynamic schema
      const dynamicSchema = await createDynamicPlaylistSchema()

      // Log the data being validated for debugging
      console.log("Validating playlist data with dynamic schema:", playlistData)

      dynamicSchema.parse(playlistData)
    } catch (error) {
      console.error("Dynamic schema validation error:", error)

      // Fall back to standard schema if dynamic validation fails
      try {
        playlistSchema.parse(playlistData)
      } catch (error) {
        console.error("Standard schema validation error:", error)
        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: error.flatten().fieldErrors,
          }
        }
        throw error
      }
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
    const name = formData.get("name") as string
    const spotifyLink = formData.get("spotifyLink") as string
    const followers = Number(formData.get("followers"))

    // Normalize case for genre and language
    const primaryGenreRaw = formData.get("primaryGenre") as string
    const primaryGenre = await normalizeGenre(primaryGenreRaw)

    const subgenres = formData.getAll("subgenres") as string[]
    const moods = formData.getAll("moods") as string[]
    const tempos = formData.getAll("tempos") as string[]

    const vocalRaw = formData.get("vocal") as string
    const vocal = normalizeVocal(vocalRaw)

    const eras = formData.getAll("eras") as string[]

    const languageRaw = formData.get("language") as string
    const language = normalizeLanguage(languageRaw)

    // Validate at least three subgenres are selected
    if (!subgenres || subgenres.length < 3) {
      console.error("Not enough subgenres selected")
      return {
        success: false,
        error: { subgenres: ["Please select at least 3 subgenres"] },
      }
    }

    // Create playlist data object
    const playlistData = {
      name,
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

    // Validate input using dynamic schema
    try {
      // First try with dynamic schema
      const dynamicSchema = await createDynamicPlaylistSchema()
      dynamicSchema.parse(playlistData)
    } catch (error) {
      console.error("Dynamic schema validation error:", error)

      // Fall back to standard schema if dynamic validation fails
      try {
        playlistSchema.parse(playlistData)
      } catch (error) {
        console.error("Standard schema validation error:", error)
        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: error.flatten().fieldErrors,
          }
        }
        throw error
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
export async function editPlaylist(playlistId: string, prevState: any, formData: any) {
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

    // Check if formData is a FormData instance or a plain object
    let name, spotifyLink, followers, primaryGenre, subgenres, moods, tempos, vocal, eras, language
    let primaryGenreRaw, vocalRaw, languageRaw

    if (formData instanceof FormData) {
      // Extract data from FormData
      name = formData.get("name") as string
      spotifyLink = formData.get("spotifyLink") as string
      followers = Number(formData.get("followers"))
      primaryGenreRaw = formData.get("primaryGenre") as string
      primaryGenre = await normalizeGenre(primaryGenreRaw)
      subgenres = formData.getAll("subgenres") as string[]
      moods = formData.getAll("moods") as string[]
      tempos = formData.getAll("tempos") as string[]
      vocalRaw = formData.get("vocal") as string
      vocal = normalizeVocal(vocalRaw)
      eras = formData.getAll("eras") as string[]
      languageRaw = formData.get("language") as string
      language = normalizeLanguage(languageRaw)
    } else {
      // Handle case where formData is a plain object (not FormData)
      console.log("FormData is not a FormData instance:", formData)

      // Extract data from object
      name = formData.name || playlist.name
      spotifyLink = formData.spotifyLink || playlist.spotifyLink
      followers = Number(formData.followers) || playlist.followers
      primaryGenre = (await normalizeGenre(formData.primaryGenre)) || playlist.primaryGenre
      subgenres = Array.isArray(formData.subgenres) ? formData.subgenres : playlist.subgenres || []
      moods = Array.isArray(formData.moods) ? formData.moods : playlist.moods || []
      tempos = Array.isArray(formData.tempos) ? formData.tempos : playlist.tempos || []
      vocal = normalizeVocal(formData.vocal) || playlist.vocal
      eras = Array.isArray(formData.eras) ? formData.eras : playlist.eras || []
      language = normalizeLanguage(formData.language) || playlist.language
    }

    // Validate at least three subgenres are selected
    if (!subgenres || subgenres.length < 3) {
      console.error("Not enough subgenres selected")
      return {
        success: false,
        error: { subgenres: ["Please select at least 3 subgenres"] },
      }
    }

    // Create playlist data object
    const playlistData = {
      name,
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

    console.log("Updating playlist with data:", playlistData)

    // Validate input using dynamic schema
    try {
      // First try with dynamic schema
      const dynamicSchema = await createDynamicPlaylistSchema()

      // Log the data being validated for debugging
      console.log("Validating playlist data with dynamic schema:", playlistData)

      dynamicSchema.parse(playlistData)
    } catch (error) {
      console.error("Dynamic schema validation error:", error)

      // Fall back to standard schema if dynamic validation fails
      try {
        playlistSchema.parse(playlistData)
      } catch (error) {
        console.error("Standard schema validation error:", error)
        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: error.flatten().fieldErrors,
          }
        }
        throw error
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
