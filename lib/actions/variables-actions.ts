"use server"

import { getVariables, setVariables, resetVariables, type VariableCategory, type Variable } from "@/lib/variables"
import { requireAdmin } from "@/lib/actions/admin"

// Get variables for a specific category
export async function getVariablesForCategory(category: VariableCategory) {
  try {
    // Check admin authentication for security
    const { isAuthenticated } = await requireAdmin()
    if (!isAuthenticated) {
      return { success: false, error: "Unauthorized", variables: [] }
    }

    const variables = await getVariables(category)
    return { success: true, variables }
  } catch (error) {
    console.error(`Error getting ${category} variables:`, error)
    return { success: false, error: `Failed to fetch ${category} variables`, variables: [] }
  }
}

// Update variables for a specific category
export async function updateVariablesForCategory(category: VariableCategory, variables: Variable[]) {
  try {
    // Check admin authentication for security
    const { isAuthenticated } = await requireAdmin()
    if (!isAuthenticated) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate variables based on category
    if (!Array.isArray(variables)) {
      return { success: false, error: "Invalid variables format" }
    }

    // Perform basic validation based on category
    if (category === "tempos") {
      for (const variable of variables) {
        if (!variable.id || !variable.name || !("bpmRange" in variable)) {
          return { success: false, error: "All tempos must have id, name, and bpmRange" }
        }
      }
    } else if (category === "vocals" || category === "moods" || category === "eras" || category === "languages") {
      for (const variable of variables) {
        if (!variable.id || !variable.name) {
          return { success: false, error: `All ${category} must have id and name` }
        }
      }
    } else if (category === "genres") {
      for (const variable of variables) {
        if (!variable.id || !variable.name) {
          return { success: false, error: "All genres must have id and name" }
        }
      }
    } else if (category === "subgenres") {
      for (const variable of variables) {
        if (!variable.id || !variable.name || !("parentGenre" in variable)) {
          return { success: false, error: "All subgenres must have id, name, and parentGenre" }
        }
      }
    }

    const success = await setVariables(category, variables)

    if (success) {
      return { success: true, message: `${category} updated successfully` }
    } else {
      return { success: false, error: `Failed to update ${category}` }
    }
  } catch (error) {
    console.error(`Error updating ${category} variables:`, error)
    return { success: false, error: `An unexpected error occurred while updating ${category}` }
  }
}

// Reset variables for a specific category to defaults
export async function resetVariablesForCategory(category: VariableCategory) {
  try {
    // Check admin authentication for security
    const { isAuthenticated } = await requireAdmin()
    if (!isAuthenticated) {
      return { success: false, error: "Unauthorized" }
    }

    const success = await resetVariables(category)

    if (success) {
      const variables = await getVariables(category)
      return { success: true, message: `${category} reset to defaults`, variables }
    } else {
      return { success: false, error: `Failed to reset ${category}` }
    }
  } catch (error) {
    console.error(`Error resetting ${category} variables:`, error)
    return { success: false, error: `An unexpected error occurred while resetting ${category}` }
  }
}
