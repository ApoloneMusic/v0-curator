"use server"

import { kv } from "@vercel/kv"
import { requireAdmin } from "./admin"

// Get all curators
export async function getAllCurators() {
  try {
    // Check admin authentication
    const { isAuthenticated } = await requireAdmin()
    if (!isAuthenticated) {
      return { success: false, error: "Unauthorized" }
    }

    // Get all curator keys
    const curatorKeys = await kv.keys("curator:*")

    // Filter out nickname index keys
    const curatorIdKeys = curatorKeys.filter((key) => !key.includes("curator:nick:"))

    // Get all curators with their user data
    const curators = []
    for (const key of curatorIdKeys) {
      const curatorId = key.split(":")[1]
      const curatorData = await kv.hgetall(key)

      if (curatorData) {
        // Get associated user data
        const userData = await kv.hgetall(`user:${curatorId}`)

        if (userData) {
          // Remove password from user data
          const { password, ...userWithoutPassword } = userData

          // Combine user and curator data
          const combinedData = {
            id: curatorId,
            ...userWithoutPassword,
            ...curatorData,
          }

          curators.push(combinedData)
        }
      }
    }

    return { success: true, curators }
  } catch (error) {
    console.error("Error getting curators:", error)
    return { success: false, error: "Failed to fetch curators" }
  }
}

// Update curator
export async function updateCurator(curatorData: any) {
  try {
    // Check admin authentication
    const { isAuthenticated } = await requireAdmin()
    if (!isAuthenticated) {
      return { success: false, error: "Unauthorized" }
    }

    const { id, ...data } = curatorData

    // Get existing curator
    const existingCurator = await kv.hgetall(`curator:${id}`)
    if (!existingCurator) {
      return { success: false, error: "Curator not found" }
    }

    // Separate user and curator fields
    const userFields: Record<string, any> = {}
    const curatorFields: Record<string, any> = {}

    // Determine which fields go where
    const userFieldNames = ["name", "email", "role"]
    const curatorFieldNames = [
      "curatorNick",
      "phoneNumber",
      "status",
      "credits",
      "accepted",
      "declined",
      "curatorScore",
      "playlists",
    ]

    Object.entries(data).forEach(([key, value]) => {
      if (userFieldNames.includes(key)) {
        userFields[key] = value
      } else if (curatorFieldNames.includes(key)) {
        curatorFields[key] = value
      }
    })

    // Update user data if there are fields to update
    if (Object.keys(userFields).length > 0) {
      userFields.updatedAt = Date.now()
      await kv.hset(`user:${id}`, userFields)
    }

    // Update curator data
    curatorFields.updatedAt = Date.now()
    await kv.hset(`curator:${id}`, curatorFields)

    // Update curator nickname index if changed
    if (curatorFields.curatorNick && curatorFields.curatorNick !== existingCurator.curatorNick) {
      // Delete old index if it exists
      if (existingCurator.curatorNick) {
        await kv.del(`curator:nick:${existingCurator.curatorNick.toLowerCase()}`)
      }
      // Create new index
      await kv.set(`curator:nick:${curatorFields.curatorNick.toLowerCase()}`, id)
    }

    return { success: true, message: "Curator updated successfully" }
  } catch (error) {
    console.error("Error updating curator:", error)
    return { success: false, error: "Failed to update curator" }
  }
}
