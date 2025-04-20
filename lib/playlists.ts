import { z } from "zod"
import { kv } from "@vercel/kv"

// Constants for playlist attributes
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

export const SUBGENRES = [
  "Pop_Rock",
  "Dance_Pop",
  "Indie_Pop",
  "Synth_Pop",
  "Teen_Pop",
  "Adult_Contemporary",
  "Bedroom_Pop",
  "Lo-fi_Hip-Hop",
  "Alternative_Hip-Hop",
  "Gangsta_Rap",
  "Melodic_Rap",
  "Old_School",
  "Contemporary_R&B",
  "Neo-Soul",
  "Alt-R&B",
  "Quiet_Storm",
  "Gospel_R&B",
  "Modern_Soul",
  "New_Jack_Swing",
  "Soul_Pop",
  "Alternative_Rock",
  "Classic_Rock",
  "Hard_Rock",
  "Indie_Rock",
  "Progressive_Rock",
  "Punk_Rock",
  "Psychedelic_Rock",
  "Blues_Rock",
  "Pop_Rock_Alt",
  "Drum_and_Bass",
  "Future_Bass",
  "Traditional_Country",
  "Country_Pop",
  "Country_Rock",
  "Alt-Country",
  "Smooth_Jazz",
  "Contemporary_Jazz",
  "Contemporary_Classical",
  "Neo-Classical",
  "Film_Score",
  "Traditional_Folk",
  "Contemporary_Folk",
  "Indie_Folk",
  "Singer-Songwriter",
  "Folk_Rock",
  "Latin_Pop",
  "Latin_Urban",
  "Middle_Eastern",
  "Roots_Reggae",
  "Reggae_Fusion",
  "Heavy_Metal",
  "Thrash_Metal",
  "Death_Metal",
  "Progressive_Metal",
  "Delta_Blues",
  "Chicago_Blues",
  "Blues_Rock_Alt",
  "Contemporary_Blues",
  "Electric_Blues",
  "Indie_Rock_Alt",
  "Indie_Pop_Alt",
  "Indie_Folk_Alt",
  "Dream_Pop",
  "Alternative_Rock_Alt",
  "Post-Punk",
  "New_Wave",
  "Grunge_Alt",
  "P-Funk",
  "Funk_Rock",
  "Jazz-Funk",
  "Contemporary_Funk",
  "Disco_Funk",
  "Contemporary_Gospel",
  "Christian_Rock",
  "Christian_Pop",
  "Christian_Hip-Hop",
  "Dark_Ambient",
  "New_Age",
  "Ambient_Electronic",
  "Hardcore_Punk",
  "Pop_Punk",
  "Post-Punk_Alt",
  "Ska_Punk",
  "Classic_Punk",
  "Spoken_Word",
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

// Add the missing SUBGENRE_DISPLAY_MAP
export const SUBGENRE_DISPLAY_MAP: Record<string, string> = {
  Pop_Rock: "Pop Rock",
  Dance_Pop: "Dance Pop",
  Indie_Pop: "Indie Pop",
  Synth_Pop: "Synth Pop",
  Teen_Pop: "Teen Pop",
  Adult_Contemporary: "Adult Contemporary",
  Bedroom_Pop: "Bedroom Pop",
  "Lo-fi_Hip-Hop": "Lo-fi Hip-Hop",
  "Alternative_Hip-Hop": "Alternative Hip-Hop",
  Gangsta_Rap: "Gangsta Rap",
  Melodic_Rap: "Melodic Rap",
  Old_School: "Old School",
  "Contemporary_R&B": "Contemporary R&B",
  "Neo-Soul": "Neo-Soul",
  "Alt-R&B": "Alt-R&B",
  Quiet_Storm: "Quiet Storm",
  "Gospel_R&B": "Gospel R&B",
  Modern_Soul: "Modern Soul",
  New_Jack_Swing: "New Jack Swing",
  Soul_Pop: "Soul Pop",
  Alternative_Rock: "Alternative Rock",
  Classic_Rock: "Classic Rock",
  Hard_Rock: "Hard Rock",
  Indie_Rock: "Indie Rock",
  Progressive_Rock: "Progressive Rock",
  Punk_Rock: "Punk Rock",
  Psychedelic_Rock: "Psychedelic Rock",
  Blues_Rock: "Blues Rock",
  Pop_Rock_Alt: "Pop Rock",
  Drum_and_Bass: "Drum and Bass",
  Future_Bass: "Future Bass",
  Traditional_Country: "Traditional Country",
  Country_Pop: "Country Pop",
  Country_Rock: "Country Rock",
  "Alt-Country": "Alt-Country",
  Smooth_Jazz: "Smooth Jazz",
  Contemporary_Jazz: "Contemporary Jazz",
  Contemporary_Classical: "Contemporary Classical",
  "Neo-Classical": "Neo-Classical",
  Film_Score: "Film Score",
  Traditional_Folk: "Traditional Folk",
  Contemporary_Folk: "Contemporary Folk",
  Indie_Folk: "Indie Folk",
  "Singer-Songwriter": "Singer-Songwriter",
  Folk_Rock: "Folk Rock",
  Latin_Pop: "Latin Pop",
  Latin_Urban: "Latin Urban",
  Middle_Eastern: "Middle Eastern",
  Roots_Reggae: "Roots Reggae",
  Reggae_Fusion: "Reggae Fusion",
  Heavy_Metal: "Heavy Metal",
  Thrash_Metal: "Thrash Metal",
  Death_Metal: "Death Metal",
  Progressive_Metal: "Progressive Metal",
  Delta_Blues: "Delta Blues",
  Chicago_Blues: "Chicago Blues",
  Blues_Rock_Alt: "Blues Rock",
  Contemporary_Blues: "Contemporary Blues",
  Electric_Blues: "Electric Blues",
  Indie_Rock_Alt: "Indie Rock",
  Indie_Pop_Alt: "Indie Pop",
  Indie_Folk_Alt: "Indie Folk",
  Dream_Pop: "Dream Pop",
  Alternative_Rock_Alt: "Alternative Rock",
  "Post-Punk": "Post-Punk",
  New_Wave: "New Wave",
  Grunge_Alt: "Grunge",
  "P-Funk": "P-Funk",
  Funk_Rock: "Funk Rock",
  "Jazz-Funk": "Jazz-Funk",
  Contemporary_Funk: "Contemporary Funk",
  Disco_Funk: "Disco Funk",
  Contemporary_Gospel: "Contemporary Gospel",
  Christian_Rock: "Christian Rock",
  Christian_Pop: "Christian Pop",
  "Christian_Hip-Hop": "Christian Hip-Hop",
  Dark_Ambient: "Dark Ambient",
  New_Age: "New Age",
  Ambient_Electronic: "Ambient Electronic",
  Hardcore_Punk: "Hardcore Punk",
  Pop_Punk: "Pop Punk",
  "Post-Punk_Alt": "Post-Punk",
  Ska_Punk: "Ska Punk",
  Classic_Punk: "Classic Punk",
  Spoken_Word: "Spoken Word",
}

// Playlist type definition
export type Playlist = {
  id: string
  owner: string
  spotifyLink: string
  followers: number
  primaryGenre: string
  subgenres: string[]
  moods: string[]
  tempos: string[]
  vocal: string
  eras: string[]
  language: string
  createdAt: number
  updatedAt: number
}

// Validation schema for playlist data
export const playlistSchema = z.object({
  spotifyLink: z.string().url("Please enter a valid Spotify link"),
  followers: z.number().int().nonnegative("Followers must be a non-negative integer"),
  primaryGenre: z.enum([...PRIMARY_GENRES] as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a valid primary genre" }),
  }),
  subgenres: z.array(z.enum([...SUBGENRES] as [string, ...string[]])).nonempty("Please select at least one subgenre"),
  moods: z.array(z.string()),
  tempos: z.array(z.string()),
  vocal: z.enum([...VOCALS] as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a valid vocal type" }),
  }),
  eras: z.array(z.string()),
  language: z.enum([...LANGUAGES] as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a valid language" }),
  }),
})

// Function to create a new playlist
export async function createPlaylist(
  owner: string,
  playlistData: Omit<Playlist, "id" | "owner" | "createdAt" | "updatedAt">,
): Promise<Playlist | null> {
  try {
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
      subgenres: playlist.subgenres,
      moods: playlist.moods,
      tempos: playlist.tempos,
      vocal: playlist.vocal,
      eras: playlist.eras,
      language: playlist.language,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
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
    const keys = await kv.keys("playlist:*")
    const playlists: Playlist[] = []

    for (const key of keys) {
      const playlist = await kv.hgetall<Playlist>(key)
      if (playlist) {
        playlists.push(playlist)
      }
    }

    return playlists
  } catch (error) {
    console.error("Error getting all playlists:", error)
    return []
  }
}
