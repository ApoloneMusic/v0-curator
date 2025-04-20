export type CuratorStatus = "unverified" | "verified" | "declined" | "suspicious" | "blocked"

export interface Curator {
  id: string
  name: string
  email: string
  curatorNick: string
  phoneNumber: string
  status: CuratorStatus
  credits: number
  accepted: number
  declined: number
  curatorScore: number
  playlists: string[]
  createdAt: number
  updatedAt: number
}

// Extend the User type to include curator fields
export interface User {
  id: string
  name: string
  email: string
  role: string
  curatorNick?: string
  phoneNumber?: string
  status?: CuratorStatus
  credits?: number
  accepted?: number
  declined?: number
  curatorScore?: number
  createdAt: number
  updatedAt: number
}
