"use server"

import { kv } from "@vercel/kv"
import { requireAdmin } from "./admin"

// Hardcoded admin credentials - import from admin.ts
import { ADMIN_EMAIL } from "./admin"

// Get all admin users
export async function getAllAdminUsers() {
  try {
    // Check admin authentication
    const { isAuthenticated } = await requireAdmin()
    if (!isAuthenticated) {
      return { success: false, error: "Unauthorized", admins: [] }
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

    // Get all admin users
    const admins = []
    let hardcodedAdminFound = false

    for (const key of userIdKeys) {
      try {
        const userData = await kv.hgetall(key)
        if (userData && userData.role === "admin") {
          // Remove password from user data
          const { password, ...userWithoutPassword } = userData
          admins.push(userWithoutPassword)

          // Check if this is the hardcoded admin
          if (userData.email === ADMIN_EMAIL) {
            hardcodedAdminFound = true
          }
        }
      } catch (userError) {
        console.error(`Error fetching user data for ${key}:`, userError)
      }
    }

    // If the hardcoded admin is not found in the database, add it to the results
    if (!hardcodedAdminFound) {
      admins.push({
        id: "hardcoded-admin",
        name: "Default Admin",
        email: ADMIN_EMAIL,
        role: "admin",
        createdAt: 0, // We don't know when it was created
        updatedAt: 0, // We don't know when it was last updated
      })
    }

    return { success: true, admins }
  } catch (error) {
    console.error("Error getting admin users:", error)
    return { success: false, error: "Failed to fetch admin users", admins: [] }
  }
}

// Create a new admin user
export async function createAdminUser(userData: {
  name: string
  email: string
  password: string
}) {
  try {
    // Check admin authentication
    const { isAuthenticated } = await requireAdmin()
    if (!isAuthenticated) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if trying to create the hardcoded admin
    if (userData.email === ADMIN_EMAIL) {
      return { success: false, error: "Cannot create a user with the default admin email" }
    }

    // Import the createUser function
    const { createUser } = await import("@/lib/auth")

    // Create the user with admin role
    const user = await createUser({
      ...userData,
      role: "admin",
    })

    if (!user) {
      return { success: false, error: "Failed to create admin user" }
    }

    return { success: true, message: "Admin user created successfully", user }
  } catch (error) {
    console.error("Error creating admin user:", error)
    return { success: false, error: "Failed to create admin user" }
  }
}

// Delete an admin user
export async function deleteAdminUser(id: string) {
  try {
    // Check admin authentication
    const { isAuthenticated, email } = await requireAdmin()
    if (!isAuthenticated) {
      return { success: false, error: "Unauthorized" }
    }

    // Prevent deleting the hardcoded admin
    if (id === "hardcoded-admin") {
      return { success: false, error: "Cannot delete the default admin user" }
    }

    // Get user data
    const userData = await kv.hgetall(`user:${id}`)
    if (!userData) {
      return { success: false, error: "User not found" }
    }

    // Check if user is an admin
    if (userData.role !== "admin") {
      return { success: false, error: "User is not an admin" }
    }

    // Prevent deleting yourself
    if (userData.email === email) {
      return { success: false, error: "You cannot delete your own admin account" }
    }

    // Delete user data
    await kv.del(`user:${id}`)

    // Delete email index
    await kv.del(`user:email:${userData.email.toLowerCase()}`)

    // Delete sessions for this user
    const sessionKeys = (await kv.keys(`session:*`)) || []
    for (const key of sessionKeys) {
      const session = await kv.hgetall(key)
      if (session && session.userId === id) {
        await kv.del(key)
      }
    }

    return { success: true, message: "Admin user deleted successfully" }
  } catch (error) {
    console.error("Error deleting admin user:", error)
    return { success: false, error: "Failed to delete admin user" }
  }
}
