import { kv } from "@vercel/kv"

const API_ENDPOINT = "https://api.spotify.com/v1"
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token"

// Update the credential check at the top of the file to be more informative
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || ""
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ""

// Check if credentials are available
const hasCredentials = SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET
if (!hasCredentials) {
  console.warn(
    "Spotify API credentials are not set. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.",
    { clientIdExists: !!SPOTIFY_CLIENT_ID, clientSecretExists: !!SPOTIFY_CLIENT_SECRET },
  )
}

/**
 * Get a valid Spotify access token using Client Credentials flow
 * This flow is appropriate for server-to-server requests that don't access user data
 */
async function getAccessToken(): Promise<string> {
  try {
    // Log environment for debugging
    console.log("Environment check:", {
      nodeEnv: process.env.NODE_ENV,
      hasClientId: !!SPOTIFY_CLIENT_ID,
      hasClientSecret: !!SPOTIFY_CLIENT_SECRET,
    })

    // Check if credentials exist before proceeding
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.warn("Missing Spotify credentials - using mock token")
      return "mock-token-for-fallback"
    }

    // Check if we have a cached token
    const cachedToken = await kv.get<{ token: string; expires: number }>("spotify:access_token")

    // If we have a valid cached token that's not expired, return it
    if (cachedToken && cachedToken.token && cachedToken.expires > Date.now()) {
      console.log("Using cached Spotify access token")
      return cachedToken.token
    }

    console.log("Requesting new Spotify access token")

    // Verify credentials are available
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      throw new Error("Spotify API credentials are not set")
    }

    // Create authorization string (Basic Auth)
    const authString = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")

    // Request new token using Client Credentials flow
    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to get access token: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const token = data.access_token
    const expiresIn = data.expires_in * 1000 // convert to milliseconds

    // Add a buffer to expiration (5 minutes) to ensure we refresh before actual expiration
    const expiresAt = Date.now() + expiresIn - 5 * 60 * 1000

    // Store the token in cache with expiration
    await kv.set(
      "spotify:access_token",
      {
        token,
        expires: expiresAt,
      },
      { ex: Math.floor(expiresIn / 1000) - 300 },
    ) // KV expiration in seconds, minus 5 minutes

    return token
  } catch (error) {
    console.error("Error getting Spotify access token:", error)
    throw error
  }
}

export interface SpotifyPlaylist {
  id: string
  name: string
  external_urls: {
    spotify: string
  }
  images: Array<{
    url: string
    height: number | null
    width: number | null
  }>
  owner: {
    display_name: string
    id: string
  }
  tracks: {
    total: number
  }
  followers: {
    total: number
  }
  // Add other properties as needed
}

/**
 * Search for playlists on Spotify
 * @param query Search query
 * @param limit Number of results to return (max 50)
 * @param offset Offset for pagination
 */
export async function searchPlaylists(
  query: string,
  limit = 10,
  offset = 0,
): Promise<{
  playlists: {
    items: SpotifyPlaylist[]
    total: number
    offset: number
    limit: number
    next: string | null
    previous: string | null
  }
}> {
  try {
    // Check cache first
    const cacheKey = `spotify:search:${query}:${limit}:${offset}`
    const cachedResults = await kv.get(cacheKey)

    if (cachedResults) {
      console.log("Using cached search results for:", query)
      return cachedResults as any
    }

    console.log("Searching Spotify for playlists:", query)

    // Get access token
    const accessToken = await getAccessToken()

    // If we got a mock token, return mock data instead of making an API call
    if (accessToken === "mock-token-for-fallback") {
      console.log("Using mock data due to missing credentials")
      return {
        playlists: {
          items: [
            {
              id: "37i9dQZF1DXcF6B6QPhFDv",
              name: "Rock Classics",
              external_urls: {
                spotify: "https://open.spotify.com/playlist/37i9dQZF1DXcF6B6QPhFDv",
              },
              images: [
                {
                  url: "https://i.scdn.co/image/ab67706f00000003b5d03a1a0aed6c1c9c53a9d8",
                  height: 300,
                  width: 300,
                },
              ],
              owner: {
                display_name: "Spotify",
                id: "spotify",
              },
              tracks: {
                total: 100,
              },
              followers: {
                total: 5000000,
              },
            },
            {
              id: "37i9dQZF1DWXRqgorJj26U",
              name: "Rock Mix",
              external_urls: {
                spotify: "https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U",
              },
              images: [
                {
                  url: "https://i.scdn.co/image/ab67706f00000003c15d79d5c2e5fbc3f1aa3aea",
                  height: 300,
                  width: 300,
                },
              ],
              owner: {
                display_name: "Spotify",
                id: "spotify",
              },
              tracks: {
                total: 50,
              },
              followers: {
                total: 3000000,
              },
            },
          ],
          total: 2,
          offset: 0,
          limit: 10,
          next: null,
          previous: null,
        },
      }
    }

    // Set up request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      const response = await fetch(
        `${API_ENDPOINT}/search?q=${encodeURIComponent(query)}&type=playlist&limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
          signal: controller.signal,
        },
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to search playlists: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Failed to search playlists: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Validate the response has the expected structure
      if (!data || !data.playlists || !Array.isArray(data.playlists.items)) {
        console.error("Invalid search results received from Spotify API:", data)
        throw new Error("Invalid search results received from Spotify API")
      }

      // Filter out any null or undefined items first
      const validItems = data.playlists.items.filter((item) => item != null)

      // Ensure all required fields exist to prevent null/undefined errors
      const sanitizedData = {
        playlists: {
          ...data.playlists,
          items: validItems.map((playlist: any) => ({
            id: playlist.id || "",
            name: playlist.name || "Untitled Playlist",
            images: Array.isArray(playlist.images) ? playlist.images : [],
            external_urls: playlist.external_urls || { spotify: "" },
            owner: playlist.owner || { display_name: "Unknown", id: "" },
            tracks: playlist.tracks || { total: 0 },
            followers: playlist.followers || { total: 0 },
          })),
        },
      }

      // Cache the search results for 10 minutes
      await kv.set(cacheKey, sanitizedData, { ex: 600 })

      return sanitizedData
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === "AbortError") {
        throw new Error("Spotify API request timed out")
      }
      throw error
    }
  } catch (error) {
    console.error("Error searching Spotify playlists:", error)
    throw error
  }
}

/**
 * Get details for a specific Spotify playlist
 * @param playlistId Spotify playlist ID
 */
export async function getPlaylistDetails(playlistId: string): Promise<SpotifyPlaylist> {
  try {
    // Check cache first
    const cacheKey = `spotify:playlist:${playlistId}`
    const cachedPlaylist = await kv.get<SpotifyPlaylist>(cacheKey)

    if (cachedPlaylist) {
      console.log("Using cached playlist details for:", playlistId)
      return cachedPlaylist
    }

    console.log("Fetching playlist details from Spotify API for:", playlistId)

    // Get access token
    const accessToken = await getAccessToken()

    // If we got a mock token, return mock data instead of making an API call
    if (accessToken === "mock-token-for-fallback") {
      console.log("Using mock data due to missing credentials")
      return {
        id: playlistId,
        name: "Mock Playlist",
        external_urls: {
          spotify: `https://open.spotify.com/playlist/${playlistId}`,
        },
        images: [
          {
            url: "https://i.scdn.co/image/ab67706f00000003b5d03a1a0aed6c1c9c53a9d8",
            height: 300,
            width: 300,
          },
        ],
        owner: {
          display_name: "Spotify",
          id: "spotify",
        },
        tracks: {
          total: 100,
        },
        followers: {
          total: 5000000,
        },
      }
    }

    // Set up request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      const response = await fetch(`${API_ENDPOINT}/playlists/${playlistId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to get playlist details: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Failed to get playlist details: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Validate the response has the minimum required fields
      if (!data || !data.id) {
        console.error("Invalid playlist data received from Spotify API:", data)
        throw new Error("Invalid playlist data received from Spotify API")
      }

      // Ensure all required fields exist to prevent null/undefined errors
      const sanitizedData = {
        id: data.id,
        name: data.name || "Untitled Playlist",
        images: Array.isArray(data.images) ? data.images : [],
        external_urls: data.external_urls || { spotify: "" },
        owner: data.owner || { display_name: "Unknown", id: "" },
        tracks: data.tracks || { total: 0 },
        followers: data.followers || { total: 0 },
      }

      // Cache the playlist details for 1 hour
      await kv.set(cacheKey, sanitizedData, { ex: 3600 })

      return sanitizedData
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === "AbortError") {
        throw new Error("Spotify API request timed out")
      }
      throw error
    }
  } catch (error) {
    console.error("Error getting Spotify playlist details:", error)
    throw error
  }
}
