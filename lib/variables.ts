import { kv } from "@vercel/kv"

// Define variable types
export type VariableCategory = "tempos" | "vocals" | "moods" | "eras" | "languages" | "genres" | "subgenres"

export interface TempoVariable {
  id: string
  name: string
  bpmRange: string
}

export interface VocalVariable {
  id: string
  name: string
}

export interface SimpleVariable {
  id: string
  name: string
}

export interface GenreVariable {
  id: string
  name: string
}

export interface SubgenreVariable {
  id: string
  name: string
  parentGenre: string
}

export type Variable = TempoVariable | VocalVariable | SimpleVariable | GenreVariable | SubgenreVariable

// Default variables
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

export const DEFAULT_MOODS: SimpleVariable[] = [
  { id: "happy", name: "Happy" },
  { id: "sad", name: "Sad" },
  { id: "energetic", name: "Energetic" },
  { id: "relaxing", name: "Relaxing" },
  { id: "romantic", name: "Romantic" },
  { id: "angry", name: "Angry" },
  { id: "dreamy", name: "Dreamy" },
  { id: "dark", name: "Dark" },
  { id: "hopeful", name: "Hopeful" },
  { id: "chill", name: "Chill" },
]

export const DEFAULT_ERAS: SimpleVariable[] = [
  { id: "1950s", name: "1950s" },
  { id: "1960s", name: "1960s" },
  { id: "1970s", name: "1970s" },
  { id: "1980s", name: "1980s" },
  { id: "1990s", name: "1990s" },
  { id: "2000s", name: "2000s" },
  { id: "2010s", name: "2010s" },
  { id: "2020s", name: "2020s" },
]

export const DEFAULT_LANGUAGES: SimpleVariable[] = [
  { id: "english", name: "English" },
  { id: "spanish", name: "Spanish" },
  { id: "french", name: "French" },
  { id: "german", name: "German" },
  { id: "italian", name: "Italian" },
  { id: "portuguese", name: "Portuguese" },
  { id: "russian", name: "Russian" },
  { id: "chinese", name: "Chinese" },
  { id: "japanese", name: "Japanese" },
  { id: "korean", name: "Korean" },
  { id: "arabic", name: "Arabic" },
  { id: "hindi", name: "Hindi" },
]

export const DEFAULT_GENRES: GenreVariable[] = [
  { id: "pop", name: "Pop" },
  { id: "hip_hop", name: "Hip-Hop" },
  { id: "rnb", name: "R&B" },
  { id: "rock", name: "Rock" },
  { id: "electronic", name: "Electronic" },
  { id: "country", name: "Country" },
  { id: "jazz", name: "Jazz" },
  { id: "classical", name: "Classical" },
  { id: "folk", name: "Folk" },
  { id: "latin", name: "Latin" },
  { id: "reggae", name: "Reggae" },
  { id: "metal", name: "Metal" },
]

export const DEFAULT_SUBGENRES: SubgenreVariable[] = [
  { id: "indie_pop", name: "Indie Pop", parentGenre: "pop" },
  { id: "synth_pop", name: "Synth Pop", parentGenre: "pop" },
  { id: "k_pop", name: "K-Pop", parentGenre: "pop" },
  { id: "trap", name: "Trap", parentGenre: "hip_hop" },
  { id: "boom_bap", name: "Boom Bap", parentGenre: "hip_hop" },
  { id: "drill", name: "Drill", parentGenre: "hip_hop" },
  { id: "neo_soul", name: "Neo Soul", parentGenre: "rnb" },
  { id: "contemporary_rnb", name: "Contemporary R&B", parentGenre: "rnb" },
  { id: "indie_rock", name: "Indie Rock", parentGenre: "rock" },
  { id: "alternative_rock", name: "Alternative Rock", parentGenre: "rock" },
  { id: "punk_rock", name: "Punk Rock", parentGenre: "rock" },
  { id: "house", name: "House", parentGenre: "electronic" },
  { id: "techno", name: "Techno", parentGenre: "electronic" },
  { id: "dubstep", name: "Dubstep", parentGenre: "electronic" },
  { id: "country_pop", name: "Country Pop", parentGenre: "country" },
  { id: "bluegrass", name: "Bluegrass", parentGenre: "country" },
  { id: "bebop", name: "Bebop", parentGenre: "jazz" },
  { id: "smooth_jazz", name: "Smooth Jazz", parentGenre: "jazz" },
  { id: "baroque", name: "Baroque", parentGenre: "classical" },
  { id: "romantic", name: "Romantic", parentGenre: "classical" },
  { id: "contemporary_folk", name: "Contemporary Folk", parentGenre: "folk" },
  { id: "traditional_folk", name: "Traditional Folk", parentGenre: "folk" },
  { id: "salsa", name: "Salsa", parentGenre: "latin" },
  { id: "reggaeton", name: "Reggaeton", parentGenre: "latin" },
  { id: "dancehall", name: "Dancehall", parentGenre: "reggae" },
  { id: "dub", name: "Dub", parentGenre: "reggae" },
  { id: "heavy_metal", name: "Heavy Metal", parentGenre: "metal" },
  { id: "death_metal", name: "Death Metal", parentGenre: "metal" },
  { id: "thrash_metal", name: "Thrash Metal", parentGenre: "metal" },
]

// Database functions
export async function getVariables(category: VariableCategory): Promise<Variable[]> {
  try {
    const variables = await kv.get<Variable[]>(`variables:${category}`)

    if (!variables || variables.length === 0) {
      // Return default variables if none are stored
      if (category === "tempos") return DEFAULT_TEMPOS
      if (category === "vocals") return DEFAULT_VOCALS
      if (category === "moods") return DEFAULT_MOODS
      if (category === "eras") return DEFAULT_ERAS
      if (category === "languages") return DEFAULT_LANGUAGES
      if (category === "genres") return DEFAULT_GENRES
      if (category === "subgenres") return DEFAULT_SUBGENRES
      return []
    }

    return variables
  } catch (error) {
    console.error(`Error getting ${category} variables:`, error)

    // Return default variables on error
    if (category === "tempos") return DEFAULT_TEMPOS
    if (category === "vocals") return DEFAULT_VOCALS
    if (category === "moods") return DEFAULT_MOODS
    if (category === "eras") return DEFAULT_ERAS
    if (category === "languages") return DEFAULT_LANGUAGES
    if (category === "genres") return DEFAULT_GENRES
    if (category === "subgenres") return DEFAULT_SUBGENRES
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

    if (category === "tempos") defaultVariables = DEFAULT_TEMPOS
    if (category === "vocals") defaultVariables = DEFAULT_VOCALS
    if (category === "moods") defaultVariables = DEFAULT_MOODS
    if (category === "eras") defaultVariables = DEFAULT_ERAS
    if (category === "languages") defaultVariables = DEFAULT_LANGUAGES
    if (category === "genres") defaultVariables = DEFAULT_GENRES
    if (category === "subgenres") defaultVariables = DEFAULT_SUBGENRES

    await kv.set(`variables:${category}`, defaultVariables)
    return true
  } catch (error) {
    console.error(`Error resetting ${category} variables:`, error)
    return false
  }
}
