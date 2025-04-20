"use server"

import bcrypt from "bcryptjs"
import { z } from "zod"
import {
  createUser,
  getUserByEmail,
  createSession,
  deleteSession,
  createPasswordResetToken,
  resetPassword as resetUserPassword,
} from "./auth"

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

const resetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

// Authentication actions
export async function login(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Validate input
    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      return {
        error: result.error.flatten().fieldErrors,
        success: false,
      }
    }

    // Check if user exists
    const user = await getUserByEmail(email)
    if (!user) {
      return {
        error: { email: ["Invalid email or password"] },
        success: false,
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return {
        error: { email: ["Invalid email or password"] },
        success: false,
      }
    }

    // Create session
    await createSession(user.id)

    // Return success with redirect URL
    return {
      success: true,
      redirectUrl: "/dashboard",
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      error: { _form: ["An unexpected error occurred. Please try again."] },
      success: false,
    }
  }
}

export async function signup(prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Validate input
    const result = signupSchema.safeParse({ name, email, password })
    if (!result.success) {
      return {
        error: result.error.flatten().fieldErrors,
        success: false,
      }
    }

    // Create user
    const user = await createUser({ name, email, password })
    if (!user) {
      return {
        error: { email: ["Email already in use"] },
        success: false,
      }
    }

    // Create session
    await createSession(user.id)

    // Return success with redirect URL
    return {
      success: true,
      redirectUrl: "/dashboard",
    }
  } catch (error) {
    console.error("Signup error:", error)
    return {
      error: { _form: ["An unexpected error occurred. Please try again."] },
      success: false,
    }
  }
}

export async function logout() {
  await deleteSession()
  return { redirectUrl: "/login" }
}

export async function requestPasswordReset(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string

    // Validate input
    const result = resetRequestSchema.safeParse({ email })
    if (!result.success) {
      return {
        error: result.error.flatten().fieldErrors,
        success: false,
      }
    }

    // Create reset token
    const token = await createPasswordResetToken(email)

    // In a real app, you would send an email with the reset link
    // For demo purposes, we'll just return success

    return {
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
      // For demo purposes only, remove in production
      token: token,
    }
  } catch (error) {
    console.error("Password reset request error:", error)
    return {
      error: { _form: ["An unexpected error occurred. Please try again."] },
      success: false,
    }
  }
}

export async function resetPassword(token: string, prevState: any, formData: FormData) {
  try {
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Validate input
    const result = resetPasswordSchema.safeParse({ password, confirmPassword })
    if (!result.success) {
      return {
        error: result.error.flatten().fieldErrors,
        success: false,
      }
    }

    // Reset password
    const success = await resetUserPassword(token, password)
    if (!success) {
      return {
        error: { _form: ["Invalid or expired reset token"] },
        success: false,
      }
    }

    return {
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    }
  } catch (error) {
    console.error("Password reset error:", error)
    return {
      error: { _form: ["An unexpected error occurred. Please try again."] },
      success: false,
    }
  }
}
