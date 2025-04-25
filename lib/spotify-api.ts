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

// Define types for Spotify API responses
export interface SpotifyUser {
  id: string
  display_name: string
  external_urls: {
    spotify: string
  }
  followers: {
    total: number
  }
  images: Array<{
    url: string
    height: number | null
    width: number | null
  }>
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
}

/**
 * Multi-strategy search for Spotify users
 * This function tries multiple approaches to find users based on the query
 * @param query Search query
 * @param limit Number of results to return
 * @param offset Offset for pagination
 */
export async function findSpotifyUsers(query: string, limit = 10, offset = 0) {
  try {
    console.log(`Finding Spotify users with query: "${query}"`)

    // Normalize the query
    const normalizedQuery = query.trim().toLowerCase()

    // If the query looks like a Spotify URI or URL, extract the ID
    let spotifyId = null

    // Check for Spotify URI format: spotify:user:username
    const uriMatch = normalizedQuery.match(/spotify:user:([a-zA-Z0-9_-]+)/)
    if (uriMatch) {
      spotifyId = uriMatch[1]
      console.log(`Extracted Spotify user ID from URI: ${spotifyId}`)
    }

    // Check for Spotify URL format: https://open.spotify.com/user/username
    const urlMatch = normalizedQuery.match(/spotify\.com\/user\/([a-zA-Z0-9_-]+)/)
    if (urlMatch) {
      spotifyId = urlMatch[1]
      console.log(`Extracted Spotify user ID from URL: ${spotifyId}`)
    }

    // If we found a Spotify ID, try to get the user directly
    if (spotifyId) {
      try {
        const user = await getUserProfile(spotifyId)
        return {
          users: [user],
          total: 1,
          offset: 0,
          limit: 1,
          next: null,
          previous: null,
        }
      } catch (error) {
        console.log(`Failed to get user by ID ${spotifyId}, falling back to search`)
        // Continue with search if direct lookup fails
      }
    }

    // Strategy 1: Search for playlists with the query and extract unique creators
    const results = await searchWithMultipleQueries(normalizedQuery, limit, offset)

    // Return the results
    return results
  } catch (error) {
    console.error("Error finding Spotify users:", error)
    throw error
  }
}

/**
 * Search with multiple query variations to improve results
 * @param query Base search query
 * @param limit Number of results to return
 * @param offset Offset for pagination
 */
async function searchWithMultipleQueries(query: string, limit = 10, offset = 0) {
  // Create an array of search queries with different variations
  const searchQueries = [
    query, // Original query
    `"${query}"`, // Exact match
  ]

  // If the query has spaces, also try without spaces
  if (query.includes(" ")) {
    searchQueries.push(query.replace(/\s+/g, ""))
  }

  // If the query looks like a username (no spaces), try adding "user:" prefix
  if (!query.includes(" ")) {
    searchQueries.push(`user:${query}`)
  }

  console.log("Trying multiple search variations:", searchQueries)

  // Map to store unique users by ID
  const usersMap = new Map()
  let totalResults = 0

  // Try each query variation
  for (const searchQuery of searchQueries) {
    try {
      // Search for playlists with this query
      const result = await searchPlaylists(searchQuery, Math.min(50, limit * 2), offset)

      if (result && result.playlists && Array.isArray(result.playlists.items)) {
        // Extract unique creators from playlists
        result.playlists.items.forEach((playlist) => {
          if (playlist.owner && playlist.owner.id && !usersMap.has(playlist.owner.id)) {
            // Try to match the owner display name or ID with the original query
            const ownerName = (playlist.owner.display_name || "").toLowerCase()
            const ownerId = playlist.owner.id.toLowerCase()

            // Check if the owner name or ID contains the query or vice versa
            if (
              ownerName.includes(query) ||
              ownerId.includes(query) ||
              query.includes(ownerName) ||
              query.includes(ownerId)
            ) {
              usersMap.set(playlist.owner.id, {
                id: playlist.owner.id,
                display_name: playlist.owner.display_name || "Unknown User",
                external_urls: {
                  spotify: `https://open.spotify.com/user/${playlist.owner.id}`,
                },
                // Use the first playlist image as a fallback for the creator image
                images: playlist.images && playlist.images.length > 0 ? [playlist.images[0]] : [],
                followers: { total: 0 }, // We don't have this info from the playlist search
                matchScore: calculateMatchScore(query, playlist.owner),
              })
            }
          }
        })

        totalResults += result.playlists.total
      }
    } catch (error) {
      console.warn(`Search failed for query variation "${searchQuery}":`, error)
      // Continue with next query variation
    }
  }

  // Convert map to array and sort by match score
  let users = Array.from(usersMap.values())
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit)

  // Remove the matchScore property before returning
  users = users.map((user) => {
    const { matchScore, ...userWithoutScore } = user
    return userWithoutScore
  })

  return {
    users,
    total: Math.max(users.length, totalResults),
    offset,
    limit,
    next: users.length >= limit ? `offset=${offset + limit}` : null,
    previous: offset > 0 ? `offset=${Math.max(0, offset - limit)}` : null,
  }
}

/**
 * Calculate a match score between the query and a user
 * Higher score means better match
 * @param query The search query
 * @param user The user object
 */
function calculateMatchScore(query: string, user: any): number {
  let score = 0
  const normalizedQuery = query.toLowerCase()
  const displayName = (user.display_name || "").toLowerCase()
  const userId = user.id.toLowerCase()

  // Exact matches get highest score
  if (displayName === normalizedQuery || userId === normalizedQuery) {
    score += 100
  }

  // Partial matches in display name
  if (displayName.includes(normalizedQuery)) {
    score += 50
  } else if (normalizedQuery.includes(displayName)) {
    score += 30
  }

  // Partial matches in user ID
  if (userId.includes(normalizedQuery)) {
    score += 40
  } else if (normalizedQuery.includes(userId)) {
    score += 20
  }

  // Bonus for shorter display names (more likely to be exact matches)
  score += Math.max(0, 20 - displayName.length)

  return score
}

/**
 * Get a user's playlists
 * @param userId Spotify user ID
 * @param limit Number of results to return
 * @param offset Offset for pagination
 */
export async function getUserPlaylists(userId: string, limit = 50, offset = 0) {
  try {
    const accessToken = await getAccessToken()

    // Log the request for debugging
    console.log(`Getting playlists for user ${userId} (limit: ${limit}, offset: ${offset})`)

    const response = await fetch(`${API_ENDPOINT}/users/${userId}/playlists?limit=${limit}&offset=${offset}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    // Log response status for debugging
    console.log(`Playlist request status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to get user playlists: ${response.status} ${response.statusText}`, errorText)

      // If we get a 404, the user might not exist or have no public playlists
      if (response.status === 404) {
        return {
          items: [],
          total: 0,
          limit,
          offset,
          next: null,
          previous: null,
        }
      }

      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Log success and return count for debugging
    console.log(`Successfully retrieved ${data.items?.length || 0} playlists for user ${userId}`)

    return data
  } catch (error) {
    console.error("Error getting user playlists:", error)
    throw error
  }
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

/**
 * Get playlists by a specific user or creator
 * Note: This is different from getUserPlaylists as it searches for playlists by a creator
 * @param creatorId The Spotify user ID of the creator
 */
export async function getPlaylistsByCreator(creatorId: string, limit = 10, offset = 0) {
  try {
    // Check cache first
    const cacheKey = `spotify:creator:${creatorId}:playlists:${limit}:${offset}`
    const cachedResults = await kv.get(cacheKey)

    if (cachedResults) {
      console.log("Using cached creator playlists for:", creatorId)
      return cachedResults
    }

    console.log("Fetching playlists by creator from Spotify API for:", creatorId)

    // Get access token
    const accessToken = await getAccessToken()

    // If we got a mock token, return mock data instead of making an API call
    if (accessToken === "mock-token-for-fallback") {
      console.log("Using mock data due to missing credentials")
      return {
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
              id: creatorId,
            },
            tracks: {
              total: 100,
            },
            followers: {
              total: 5000000,
            },
          },
        ],
        total: 1,
        limit,
        offset,
        next: null,
        previous: null,
      }
    }

    // Set up request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      // Use the search endpoint to find playlists by the creator
      // The query format "user:spotify" searches for playlists by the user with ID "spotify"
      const response = await fetch(
        `${API_ENDPOINT}/search?q=user:${creatorId}&type=playlist&limit=${limit}&offset=${offset}`,
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
        console.error(`Failed to get creator playlists: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Failed to get creator playlists: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Validate the response has the expected structure
      if (!data || !data.playlists || !Array.isArray(data.playlists.items)) {
        console.error("Invalid creator playlists received from Spotify API:", data)
        throw new Error("Invalid creator playlists received from Spotify API")
      }

      // Filter out any null or undefined items first
      const validItems = data.playlists.items.filter((item) => item != null)

      // Ensure all required fields exist to prevent null/undefined errors
      const sanitizedData = {
        items: validItems.map((playlist: any) => ({
          id: playlist.id || "",
          name: playlist.name || "Untitled Playlist",
          images: Array.isArray(playlist.images) ? playlist.images : [],
          external_urls: playlist.external_urls || { spotify: "" },
          owner: playlist.owner || { display_name: "Unknown", id: "" },
          tracks: playlist.tracks || { total: 0 },
          followers: playlist.followers || { total: 0 },
        })),
        total: data.playlists.total,
        limit: data.playlists.limit,
        offset: data.playlists.offset,
        next: data.playlists.next,
        previous: data.playlists.previous,
      }

      // Cache the creator playlists for 10 minutes
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
    console.error("Error getting creator playlists:", error)
    throw error
  }
}

/**
 * Get a Spotify user profile by ID
 * @param userId Spotify user ID
 */
export async function getUserProfile(userId: string) {
  try {
    // Check cache first
    const cacheKey = `spotify:user:${userId}`
    const cachedUser = await kv.get(cacheKey)

    if (cachedUser) {
      console.log("Using cached user profile for:", userId)
      return cachedUser
    }

    console.log("Fetching user profile from Spotify API for:", userId)

    // Get access token
    const accessToken = await getAccessToken()

    // If we got a mock token, return mock data instead of making an API call
    if (accessToken === "mock-token-for-fallback") {
      console.log("Using mock data due to missing credentials")
      return {
        id: userId,
        display_name: "Mock User",
        external_urls: {
          spotify: `https://open.spotify.com/user/${userId}`,
        },
        images: [
          {
            url: "https://i.scdn.co/image/ab67616d00001e02ff9ca10b55ce82ae553c8228",
            height: 300,
            width: 300,
          },
        ],
        followers: {
          total: 5000,
        },
      }
    }

    // Set up request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      const response = await fetch(`${API_ENDPOINT}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to get user profile: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Failed to get user profile: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Validate the response has the minimum required fields
      if (!data || !data.id) {
        console.error("Invalid user data received from Spotify API:", data)
        throw new Error("Invalid user data received from Spotify API")
      }

      // Ensure all required fields exist to prevent null/undefined errors
      const sanitizedData = {
        id: data.id,
        display_name: data.display_name || "Unknown User",
        external_urls: data.external_urls || { spotify: "" },
        images: Array.isArray(data.images) ? data.images : [],
        followers: data.followers || { total: 0 },
      }

      // Cache the user profile for 1 hour
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
    console.error("Error getting user profile:", error)
    throw error
  }
}
