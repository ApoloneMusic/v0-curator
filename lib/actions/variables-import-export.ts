"use server"

import { getVariables, setVariables, type VariableCategory } from "@/lib/variables"
import { requireAdmin } from "@/lib/actions/admin"

// Get all variables for all categories
export async function getAllVariables() {
  try {
    // Check admin authentication for security
    const { isAuthenticated } = await requireAdmin()
    if (!isAuthenticated) {
      return { success: false, error: "Unauthorized", data: null }
    }

    const categories: VariableCategory[] = ["genres", "subgenres", "moods", "tempos", "vocals", "eras", "languages"]
    const data: Record<string, any> = {}

    // Get variables for each category
    for (const category of categories) {
      const variables = await getVariables(category)
      data[category] = variables
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error getting all variables:", error)
    return { success: false, error: "Failed to fetch variables", data: null }
  }
}

// Import all variables for all categories
export async function importAllVariables(data: Record<string, any>) {
  try {
    // Check admin authentication for security
    const { isAuthenticated } = await requireAdmin()
    if (!isAuthenticated) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate data structure
    const categories: VariableCategory[] = ["genres", "subgenres", "moods", "tempos", "vocals", "eras", "languages"]

    for (const category of categories) {
      if (!data[category] || !Array.isArray(data[category])) {
        return { success: false, error: `Invalid data format for ${category}` }
      }
    }

    // Set variables for each category
    for (const category of categories) {
      const success = await setVariables(category, data[category])
      if (!success) {
        return { success: false, error: `Failed to set ${category} variables` }
      }
    }

    return { success: true, message: "All variables imported successfully" }
  } catch (error) {
    console.error("Error importing all variables:", error)
    return { success: false, error: "An unexpected error occurred while importing variables" }
  }
}
