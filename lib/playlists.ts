import { z } from "zod"
import { kv } from "@vercel/kv"
import { getVariables } from "@/lib/variables"

// Constants for playlist attributes (used as fallbacks)
export const PRIMARY_GENRES = [
  "Pop",
  "Hip-Hop",
  "R&B",
  "Rock",
  "Electronic",
  "Country",
  "Jazz",
  "Classical",
  "Folk",
  "Latin",
  "Reggae",
  "Metal",
  "Blues",
  "Funk",
  "Gospel",
  "Ambient",
  "Punk",
  "Spoken Word",
]

export const MOODS = [
  "Happy",
  "Sad",
  "Energetic",
  "Relaxing",
  "Romantic",
  "Angry",
  "Dreamy",
  "Dark",
  "Hopeful",
  "Chill",
]

export const TEMPOS = ["Fast", "Mid-tempo", "Slow"]

export const VOCALS = ["Male", "Female", "Instrumental", "Mixed"]

export const ERAS = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"]

export const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Hindi",
]

// Playlist type definition
export type Playlist = {
  id: string
  owner: string
  name?: string
  spotifyLink: string
  followers: number
  primaryGenre: string
  subgenres?: string[] // Add subgenres field
  moods: string[]
  tempos: string[]
  vocal: string
  eras: string[]
  language: string
  createdAt: number
  updatedAt: number
}

// Create case-insensitive enum validator
function createCaseInsensitiveEnum(values: readonly string[]) {
  return z.string().refine(
    (value) => values.some((v) => v.toLowerCase() === value.toLowerCase()),
    (value) => ({
      message: `Invalid value. Expected one of: ${values.join(", ")}`,
    }),
  )
}

// Enhance createDynamicGenreValidator to better handle edge cases

export async function createDynamicGenreValidator() {
  try {
    // Get genres from variables
    const genreVariables = await getVariables("genres")

    // Extract genre names
    const genreNames = genreVariables.map((genre) => genre.name)

    // Log the available genres for debugging
    console.log("Dynamic genre validator using genres:", genreNames)

    // If no genres found, fall back to hardcoded PRIMARY_GENRES
    const validGenres = genreNames.length > 0 ? genreNames : PRIMARY_GENRES

    // Create and return the validator
    return createCaseInsensitiveEnum(validGenres)
  } catch (error) {
    console.error("Error creating dynamic genre validator:", error)
    // Fall back to hardcoded PRIMARY_GENRES on error
    return createCaseInsensitiveEnum(PRIMARY_GENRES)
  }
}

// Enhance createDynamicLanguageValidator to better handle edge cases
export async function createDynamicLanguageValidator() {
  try {
    // Get languages from variables
    const languageVariables = await getVariables("languages")

    // Extract language names
    const languageNames = languageVariables.map((lang) => lang.name)

    // Log the available languages for debugging
    console.log("Dynamic language validator using languages:", languageNames)

    // If no languages found, fall back to hardcoded LANGUAGES
    const validLanguages = languageNames.length > 0 ? languageNames : LANGUAGES

    // Create and return the validator
    return createCaseInsensitiveEnum(validLanguages)
  } catch (error) {
    console.error("Error creating dynamic language validator:", error)
    // Fall back to hardcoded LANGUAGES on error
    return createCaseInsensitiveEnum(LANGUAGES)
  }
}

// Base playlist schema without dynamic validations
export const basePlaylistSchema = z.object({
  name: z.string().optional(),
  spotifyLink: z.string().url("Please enter a valid Spotify link"),
  followers: z.number().int().nonnegative("Followers must be a non-negative integer"),
  subgenres: z.array(z.string()).min(3, "Please select at least 3 subgenres"),
  moods: z.array(z.string()).nonempty("Please select at least one mood"),
  tempos: z.array(z.string()),
  vocal: z.string().min(1, "Vocal is required"),
  eras: z.array(z.string()).nonempty("Please select at least one era"),
})

// Original playlist schema with hardcoded validations (for backward compatibility)
export const playlistSchema = basePlaylistSchema.extend({
  primaryGenre: createCaseInsensitiveEnum(PRIMARY_GENRES),
  language: createCaseInsensitiveEnum(LANGUAGES),
})

// Create a dynamic playlist schema with up-to-date genre and language options
export async function createDynamicPlaylistSchema() {
  try {
    const genreValidator = await createDynamicGenreValidator()
    const languageValidator = await createDynamicLanguageValidator()

    return basePlaylistSchema.extend({
      primaryGenre: genreValidator,
      language: languageValidator,
    })
  } catch (error) {
    console.error("Error creating dynamic playlist schema:", error)
    // Fall back to standard schema if dynamic creation fails
    return playlistSchema
  }
}

// Function to create a new playlist
export async function createPlaylist(
  owner: string,
  playlistData: Omit<Playlist, "id" | "owner" | "createdAt" | "updatedAt">,
): Promise<Playlist | null> {
  try {
    // Validate with dynamic schema
    const dynamicSchema = await createDynamicPlaylistSchema()

    // Log the data being validated
    console.log("Validating playlist data:", {
      primaryGenre: playlistData.primaryGenre,
      language: playlistData.language,
    })

    dynamicSchema.parse(playlistData)

    const id = crypto.randomUUID()
    const createdAt = Date.now()
    const updatedAt = createdAt

    const playlist: Playlist = {
      id,
      owner,
      ...playlistData,
      createdAt,
      updatedAt,
    }

    console.log("Creating playlist with data:", playlist)
    await kv.hset(`playlist:${id}`, playlist)
    await kv.sadd(`user:${owner}:playlists`, id)

    return playlist
  } catch (error) {
    console.error("Error creating playlist:", error)
    return null
  }
}

// Function to update an existing playlist
export async function updatePlaylist(
  id: string,
  playlistData: Omit<Playlist, "id" | "owner" | "createdAt" | "updatedAt">,
): Promise<Playlist | null> {
  try {
    // Validate with dynamic schema
    const dynamicSchema = await createDynamicPlaylistSchema()

    // Log the data being validated
    console.log("Validating playlist update data:", {
      primaryGenre: playlistData.primaryGenre,
      language: playlistData.language,
    })

    dynamicSchema.parse(playlistData)

    const updatedAt = Date.now()

    const playlist: Playlist = {
      id,
      owner: "", // This will be overwritten when fetching the existing playlist
      ...playlistData,
      createdAt: 0, // This will be overwritten when fetching the existing playlist
      updatedAt,
    }

    // Fetch existing playlist to preserve owner and createdAt
    const existingPlaylist = await getPlaylistById(id)
    if (!existingPlaylist) {
      console.error("Playlist not found:", id)
      return null
    }

    const updatedPlaylist: Playlist = {
      ...existingPlaylist,
      ...playlistData,
      updatedAt,
    }

    await kv.hset(`playlist:${id}`, updatedPlaylist)

    return updatedPlaylist
  } catch (error) {
    console.error("Error updating playlist:", error)
    return null
  }
}

// Function to delete a playlist
export async function deletePlaylist(id: string): Promise<boolean> {
  try {
    const playlist = await getPlaylistById(id)

    if (!playlist) {
      console.error("Playlist not found:", id)
      return false
    }

    await kv.del(`playlist:${id}`)
    await kv.srem(`user:${playlist.owner}:playlists`, id)

    return true
  } catch (error) {
    console.error("Error deleting playlist:", error)
    return false
  }
}

// Function to get a playlist by ID
export async function getPlaylistById(id: string): Promise<Playlist | null> {
  try {
    const playlist = await kv.hgetall<Playlist>(`playlist:${id}`)

    if (!playlist) {
      console.warn("Playlist not found:", id)
      return null
    }

    return {
      id,
      owner: playlist.owner,
      spotifyLink: playlist.spotifyLink,
      followers: playlist.followers,
      primaryGenre: playlist.primaryGenre,
      moods: playlist.moods,
      tempos: playlist.tempos,
      vocal: playlist.vocal,
      eras: playlist.eras,
      language: playlist.language,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
      name: playlist.name,
      subgenres: playlist.subgenres,
    }
  } catch (error) {
    console.error("Error getting playlist by ID:", error)
    return null
  }
}

// Function to get all playlists for a curator
export async function getPlaylistsByCurator(curatorId: string): Promise<Playlist[]> {
  try {
    const playlistIds = await kv.smembers(`user:${curatorId}:playlists`)
    if (!playlistIds) return []

    const playlists: Playlist[] = []
    for (const id of playlistIds) {
      const playlist = await getPlaylistById(id)
      if (playlist) {
        playlists.push(playlist)
      }
    }

    return playlists
  } catch (error) {
    console.error("Error getting playlists by curator:", error)
    return []
  }
}

// Function to get all playlists
export async function getAllPlaylists(): Promise<Playlist[]> {
  try {
    let keys = []
    try {
      keys = await kv.keys("playlist:*")
      if (!Array.isArray(keys)) {
        console.error("Expected array of keys but got:", typeof keys)
        return []
      }
    } catch (keyError) {
      console.error("Error fetching playlist keys:", keyError)
      return []
    }

    const playlists: Playlist[] = []

    for (const key of keys) {
      try {
        const playlist = await kv.hgetall<Playlist>(key)
        if (playlist) {
          playlists.push(playlist)
        }
      } catch (playlistError) {
        console.error(`Error fetching playlist data for ${key}:`, playlistError)
      }
    }

    return playlists
  } catch (error) {
    console.error("Error getting all playlists:", error)
    return []
  }
}
