"use server"

import { cookies } from "next/headers"
import { kv } from "@vercel/kv"
import crypto from "crypto"

// Hardcoded admin credentials
export const ADMIN_EMAIL = "hrmo@sparklink.sk"
const ADMIN_PASSWORD = "123abc456"

export async function adminLogin(email: string, password: string) {
  try {
    // Check if credentials match the hardcoded values
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Create admin session
      const sessionId = crypto.randomUUID()
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

      await kv.hset(`admin-session:${sessionId}`, {
        email,
        expiresAt,
      })

      cookies().set("admin_session_id", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(expiresAt),
        path: "/",
      })

      return { success: true }
    }

    return { success: false, error: "Invalid email or password" }
  } catch (error) {
    console.error("Admin login error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function adminLogout() {
  const sessionId = cookies().get("admin_session_id")?.value

  if (sessionId) {
    await kv.del(`admin-session:${sessionId}`)
    cookies().delete("admin_session_id")
  }

  return { success: true }
}

export async function getAdminSession() {
  const sessionId = cookies().get("admin_session_id")?.value
  if (!sessionId) return null

  const session = await kv.hgetall<{ email: string; expiresAt: number }>(`admin-session:${sessionId}`)
  if (!session) return null

  if (session.expiresAt < Date.now()) {
    await adminLogout()
    return null
  }

  return session
}

export async function requireAdmin() {
  const session = await getAdminSession()

  if (!session) {
    return { isAuthenticated: false }
  }

  return { isAuthenticated: true, email: session.email }
}
