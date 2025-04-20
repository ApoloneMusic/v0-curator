import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { kv } from "@vercel/kv"
import bcrypt from "bcryptjs"
import crypto from "crypto"

// Types
export type User = {
  id: string
  name: string
  email: string
  role: string
  createdAt: number
  updatedAt: number
}

export type UserWithPassword = User & {
  password: string
}

// Curator type
export type Curator = {
  curatorNick: string
  phoneNumber: string
  status: string
  credits: number
  accepted: number
  declined: number
  curatorScore: number
}

// User database operations
export async function createUser(userData: {
  name: string
  email: string
  password: string
  role?: string
}): Promise<User | null> {
  try {
    // Validate input data
    if (!userData || !userData.email || !userData.name || !userData.password) {
      console.error("Invalid user data provided")
      return null
    }

    const email = userData.email.toLowerCase()

    // Check if user already exists
    try {
      const userId = await kv.get(`user:email:${email}`)
      if (userId) {
        console.log("User already exists with this email")
        return null
      }
    } catch (error) {
      console.error("Error checking existing user:", error)
      // Continue with user creation even if the check fails
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(userData.password, salt)

    // Generate user ID
    const userId = crypto.randomUUID()
    const timestamp = Date.now()

    // Create user object
    const user: UserWithPassword = {
      id: userId,
      name: userData.name,
      email: email,
      role: userData.role || "curator",
      password: hashedPassword,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    // Store user in Redis
    await kv.hset(`user:${userId}`, user)
    await kv.set(`user:email:${email}`, userId)

    // Return user without password
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<UserWithPassword | null> {
  try {
    if (!email) return null

    const userId = await kv.get<string>(`user:email:${email.toLowerCase()}`)
    if (!userId) return null

    const user = await kv.hgetall<UserWithPassword>(`user:${userId}`)
    return user
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    if (!id) return null

    const user = await kv.hgetall<UserWithPassword>(`user:${id}`)
    if (!user) return null

    // Return user without password
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

// Session management
export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days

  await kv.hset(`session:${sessionId}`, {
    userId,
    expiresAt,
  })

  cookies().set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt),
    path: "/",
  })

  return sessionId
}

export async function getSession(): Promise<{ userId: string } | null> {
  const sessionId = cookies().get("session_id")?.value
  if (!sessionId) return null

  const session = await kv.hgetall<{ userId: string; expiresAt: number }>(`session:${sessionId}`)
  if (!session) return null

  if (session.expiresAt < Date.now()) {
    await deleteSession()
    return null
  }

  return { userId: session.userId }
}

export async function deleteSession() {
  const sessionId = cookies().get("session_id")?.value
  if (sessionId) {
    await kv.del(`session:${sessionId}`)
    cookies().delete("session_id")
  }
}

// Authentication helpers
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) return null

  try {
    const userData = await kv.hgetall<UserWithPassword>(`user:${session.userId}`)
    if (!userData) return null

    // Get curator data if it exists
    const curatorData = await kv.hgetall<Curator>(`curator:${session.userId}`)

    // Return user without password, including curator fields if available
    const { password, ...userWithoutPassword } = userData

    if (curatorData) {
      return {
        ...userWithoutPassword,
        curatorNick: curatorData.curatorNick,
        phoneNumber: curatorData.phoneNumber,
        status: curatorData.status,
        credits: curatorData.credits,
        accepted: curatorData.accepted,
        declined: curatorData.declined,
        curatorScore: curatorData.curatorScore,
      }
    }

    return userWithoutPassword
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

// Password reset functionality
export async function createPasswordResetToken(email: string): Promise<string | null> {
  if (!email) return null

  const user = await getUserByEmail(email)
  if (!user) return null

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = Date.now() + 60 * 60 * 1000 // 1 hour

  await kv.hset(`password-reset:${token}`, {
    userId: user.id,
    expiresAt,
  })

  return token
}

export async function validatePasswordResetToken(token: string): Promise<string | null> {
  if (!token) return null

  const resetData = await kv.hgetall<{ userId: string; expiresAt: number }>(`password-reset:${token}`)
  if (!resetData) return null

  if (resetData.expiresAt < Date.now()) {
    await kv.del(`password-reset:${token}`)
    return null
  }

  return resetData.userId
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  if (!token || !newPassword) return false

  const userId = await validatePasswordResetToken(token)
  if (!userId) return false

  const user = await getUserById(userId)
  if (!user) return false

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(newPassword, salt)

  await kv.hset(`user:${userId}`, {
    password: hashedPassword,
    updatedAt: Date.now(),
  })

  await kv.del(`password-reset:${token}`)

  return true
}
