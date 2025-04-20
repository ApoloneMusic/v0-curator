"use server"

import { z } from "zod"
import { kv } from "@vercel/kv"
import { getCurrentUser } from "@/lib/auth"

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  curatorNick: z
    .string()
    .min(3, "Curator nickname must be at least 3 characters")
    .max(30, "Curator nickname must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Curator nickname can only contain letters, numbers, and underscores"),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
})

export async function updateProfile(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: { _form: ["You must be logged in to update your profile"] },
      }
    }

    // Extract form data
    const name = formData.get("name") as string
    const curatorNick = formData.get("curatorNick") as string
    const phoneNumber = formData.get("phoneNumber") as string

    // Validate input
    const result = profileUpdateSchema.safeParse({ name, curatorNick, phoneNumber })
    if (!result.success) {
      return {
        success: false,
        error: result.error.flatten().fieldErrors,
      }
    }

    // Check if curator nickname is already taken (if changed)
    if (curatorNick !== user.curatorNick) {
      const existingUser = await kv.get(`curator:nick:${curatorNick.toLowerCase()}`)
      if (existingUser && existingUser !== user.id) {
        return {
          success: false,
          error: { curatorNick: ["This curator nickname is already taken"] },
        }
      }
    }

    // Update user data
    const updates = {
      name,
      curatorNick,
      phoneNumber,
      updatedAt: Date.now(),
    }

    // Update the user record
    await kv.hset(`user:${user.id}`, updates)

    // Update curator nickname index if changed
    if (curatorNick !== user.curatorNick && user.curatorNick) {
      await kv.del(`curator:nick:${user.curatorNick.toLowerCase()}`)
    }
    await kv.set(`curator:nick:${curatorNick.toLowerCase()}`, user.id)

    return {
      success: true,
      message: "Profile updated successfully",
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    return {
      success: false,
      error: { _form: ["An unexpected error occurred. Please try again."] },
    }
  }
}
