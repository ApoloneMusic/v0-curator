"use server"

import { getVariables, type VariableCategory } from "@/lib/variables"
import { requireAdmin } from "@/lib/actions/admin"

export async function getVariablesCounts() {
  try {
    // Check admin authentication for security
    const { isAuthenticated } = await requireAdmin()
    if (!isAuthenticated) {
      return { success: false, error: "Unauthorized", counts: {} }
    }

    const categories: VariableCategory[] = ["tempos", "vocals", "moods", "eras", "languages", "genres", "subgenres"]
    const counts: Record<string, number> = {}

    for (const category of categories) {
      const variables = await getVariables(category)
      counts[category] = variables.length
    }

    return { success: true, counts }
  } catch (error) {
    console.error("Error getting variables counts:", error)
    return { success: false, error: "Failed to fetch variables counts", counts: {} }
  }
}
