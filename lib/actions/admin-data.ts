"use server"

import { kv } from "@vercel/kv"
import { z } from "zod"
import { requireAdmin } from "./admin"

// Get all users
export async function getAllUsers() {
  try {
    // Check admin authentication
    const { isAuthenticated } = await requireAdmin()
    if (!isAuthenticated) {
      return { success: false, error: "Unauthorized", users: [] }
    }

    let userKeys = []
    try {
      // Get all user keys with explicit error handling
      userKeys = await kv.keys("user:*")
      // Ensure userKeys is an array
      if (!Array.isArray(userKeys)) {
        console.error("Expected array of keys but got:", typeof userKeys)
        userKeys = []
      }
    } catch (keyError) {
      console.error("Error fetching user keys:", keyError)
      userKeys = []
    }

    // Filter out email index keys
    const userIdKeys = userKeys.filter((key) => {
      if (!key || typeof key !== "string") return false

      // Only include keys that match the pattern "user:{uuid}" and don't have additional segments
      const parts = key.split(":")
      return parts.length === 2 && parts[0] === "user" && parts[1].length > 0
    })

    // Get all users
    const users = []
    for (const key of userIdKeys) {
      try {
        const userData = await kv.hgetall(key)
        if (userData) {
          // Remove password from user data
          const { password, ...userWithoutPassword } = userData

          // Get curator data if it exists
          let curatorData = null
          try {
            curatorData = await kv.hgetall(`curator:${userData.id}`)
          } catch (curatorError) {
            console.error(`Error fetching curator data for ${userData.id}:`, curatorError)
          }

          // Combine user and curator data
          const combinedData = {
            ...userWithoutPassword,
            ...(curatorData || {}),
          }

          users.push(combinedData)
        }
      } catch (userError) {
        console.error(`Error fetching user data for ${key}:`, userError)
      }
    }

    return { success: true, users }
  } catch (error) {
    console.error("Error getting users:", error)
    return { success: false, error: "Failed to fetch users", users: [] }
  }
}

// Validation schema for user updates
const userUpdateSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  role: z.enum(["curator", "admin"]).optional(),
  curatorNick: z
    .string()
    .min(3, "Curator nickname must be at least 3 characters")
    .max(30, "Curator nickname must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Curator nickname can only contain letters, numbers, and underscores")
    .optional()
    .or(z.literal("")),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  status: z.enum(["unverified", "verified", "declined", "suspicious", "blocked"]).optional(),
  credits: z.number().int().nonnegative().optional(),
  accepted: z.number().int().nonnegative().optional(),
  declined: z.number().int().nonnegative().optional(),
  curatorScore: z.number().int().nonnegative().optional(),
})

// Update user
export async function updateUser(userData: any) {
  try {
    // Check admin authentication
    const { isAuthenticated } = await requireAdmin()
    if (!isAuthenticated) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate input
    const result = userUpdateSchema.safeParse(userData)
    if (!result.success) {
      return {
        success: false,
        error: result.error.flatten().fieldErrors,
      }
    }

    const { id, ...data } = userData

    // Get existing user
    const existingUser = await kv.hgetall(`user:${id}`)
    if (!existingUser) {
      return { success: false, error: "User not found" }
    }

    // Separate user and curator fields
    const userFields: Record<string, any> = {}
    const curatorFields: Record<string, any> = {}

    // Determine which fields go where
    const curatorFieldNames = [
      "curatorNick",
      "phoneNumber",
      "status",
      "credits",
      "accepted",
      "declined",
      "curatorScore",
    ]

    Object.entries(data).forEach(([key, value]) => {
      if (curatorFieldNames.includes(key)) {
        curatorFields[key] = value
      } else {
        userFields[key] = value
      }
    })

    // Update user data if there are fields to update
    if (Object.keys(userFields).length > 0) {
      userFields.updatedAt = Date.now()
      await kv.hset(`user:${id}`, userFields)
    }

    // Update curator data if there are fields to update
    if (Object.keys(curatorFields).length > 0) {
      curatorFields.updatedAt = Date.now()
      await kv.hset(`curator:${id}`, curatorFields)

      // Update curator nickname index if changed
      if (curatorFields.curatorNick && curatorFields.curatorNick !== existingUser.curatorNick) {
        // Delete old index if it exists
        if (existingUser.curatorNick) {
          await kv.del(`curator:nick:${existingUser.curatorNick.toLowerCase()}`)
        }
        // Create new index
        await kv.set(`curator:nick:${curatorFields.curatorNick.toLowerCase()}`, id)
      }
    }

    return { success: true, message: "User updated successfully" }
  } catch (error) {
    console.error("Error updating user:", error)
    return { success: false, error: "Failed to update user" }
  }
}

// Delete user
export async function deleteUser(id: string) {
  try {
    // Check admin authentication
    const { isAuthenticated } = await requireAdmin()
    if (!isAuthenticated) {
      return { success: false, error: "Unauthorized" }
    }

    // Get user data
    const userData = await kv.hgetall(`user:${id}`)
    if (!userData) {
      return { success: false, error: "User not found" }
    }

    // Delete user data
    await kv.del(`user:${id}`)

    // Delete email index
    await kv.del(`user:email:${userData.email.toLowerCase()}`)

    // Delete curator data if it exists
    const curatorData = await kv.hgetall(`curator:${id}`)
    if (curatorData) {
      await kv.del(`curator:${id}`)

      // Delete curator nickname index if it exists
      if (curatorData.curatorNick) {
        await kv.del(`curator:nick:${curatorData.curatorNick.toLowerCase()}`)
      }
    }

    // Delete sessions for this user
    const sessionKeys = (await kv.keys(`session:*`)) || []
    for (const key of sessionKeys) {
      const session = await kv.hgetall(key)
      if (session && session.userId === id) {
        await kv.del(key)
      }
    }

    return { success: true, message: "User deleted successfully" }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error: "Failed to delete user" }
  }
}
