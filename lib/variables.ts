import { kv } from "@vercel/kv"

// Define variable types
export type VariableCategory = "subgenres" | "tempos" | "vocals"

export interface SubgenreVariable {
  id: string
  name: string
  primaryGenre: string
}

export interface TempoVariable {
  id: string
  name: string
  bpmRange: string
}

export interface VocalVariable {
  id: string
  name: string
}

export type Variable = SubgenreVariable | TempoVariable | VocalVariable

// Default variables
export const DEFAULT_SUBGENRES: SubgenreVariable[] = [
  { id: "pop_rock", name: "Pop Rock", primaryGenre: "Pop" },
  { id: "dance_pop", name: "Dance Pop", primaryGenre: "Pop" },
  { id: "indie_pop", name: "Indie Pop", primaryGenre: "Pop" },
  { id: "synth_pop", name: "Synth Pop", primaryGenre: "Pop" },
  { id: "alt_hip_hop", name: "Alternative Hip-Hop", primaryGenre: "Hip-Hop" },
  { id: "trap", name: "Trap", primaryGenre: "Hip-Hop" },
  { id: "boom_bap", name: "Boom Bap", primaryGenre: "Hip-Hop" },
  { id: "neo_soul", name: "Neo-Soul", primaryGenre: "R&B" },
  { id: "contemporary_rb", name: "Contemporary R&B", primaryGenre: "R&B" },
  { id: "alt_rock", name: "Alternative Rock", primaryGenre: "Rock" },
  { id: "indie_rock", name: "Indie Rock", primaryGenre: "Rock" },
  { id: "hard_rock", name: "Hard Rock", primaryGenre: "Rock" },
  { id: "house", name: "House", primaryGenre: "Electronic" },
  { id: "techno", name: "Techno", primaryGenre: "Electronic" },
  { id: "dubstep", name: "Dubstep", primaryGenre: "Electronic" },
]

export const DEFAULT_TEMPOS: TempoVariable[] = [
  { id: "very_slow", name: "Very Slow", bpmRange: "< 60 BPM" },
  { id: "slow", name: "Slow", bpmRange: "60-80 BPM" },
  { id: "medium_slow", name: "Medium Slow", bpmRange: "80-100 BPM" },
  { id: "medium", name: "Medium", bpmRange: "100-120 BPM" },
  { id: "medium_fast", name: "Medium Fast", bpmRange: "120-140 BPM" },
  { id: "fast", name: "Fast", bpmRange: "140-160 BPM" },
  { id: "very_fast", name: "Very Fast", bpmRange: "> 160 BPM" },
]

export const DEFAULT_VOCALS: VocalVariable[] = [
  { id: "male_vocals", name: "Male Vocals" },
  { id: "female_vocals", name: "Female Vocals" },
  { id: "mixed_vocals", name: "Mixed Vocals" },
  { id: "instrumental", name: "Instrumental" },
  { id: "spoken_word", name: "Spoken Word" },
]

// Database functions
export async function getVariables(category: VariableCategory): Promise<Variable[]> {
  try {
    const variables = await kv.get<Variable[]>(`variables:${category}`)

    if (!variables || variables.length === 0) {
      // Return default variables if none are stored
      if (category === "subgenres") return DEFAULT_SUBGENRES
      if (category === "tempos") return DEFAULT_TEMPOS
      if (category === "vocals") return DEFAULT_VOCALS
      return []
    }

    return variables
  } catch (error) {
    console.error(`Error getting ${category} variables:`, error)

    // Return default variables on error
    if (category === "subgenres") return DEFAULT_SUBGENRES
    if (category === "tempos") return DEFAULT_TEMPOS
    if (category === "vocals") return DEFAULT_VOCALS
    return []
  }
}

export async function setVariables(category: VariableCategory, variables: Variable[]): Promise<boolean> {
  try {
    await kv.set(`variables:${category}`, variables)
    return true
  } catch (error) {
    console.error(`Error setting ${category} variables:`, error)
    return false
  }
}

export async function resetVariables(category: VariableCategory): Promise<boolean> {
  try {
    let defaultVariables: Variable[] = []

    if (category === "subgenres") defaultVariables = DEFAULT_SUBGENRES
    if (category === "tempos") defaultVariables = DEFAULT_TEMPOS
    if (category === "vocals") defaultVariables = DEFAULT_VOCALS

    await kv.set(`variables:${category}`, defaultVariables)
    return true
  } catch (error) {
    console.error(`Error resetting ${category} variables:`, error)
    return false
  }
}

// Helper function to get all primary genres from subgenres
export function getPrimaryGenresFromSubgenres(subgenres: SubgenreVariable[]): string[] {
  const uniqueGenres = new Set<string>()

  subgenres.forEach((subgenre) => {
    if (subgenre.primaryGenre) {
      uniqueGenres.add(subgenre.primaryGenre)
    }
  })

  return Array.from(uniqueGenres).sort()
}
