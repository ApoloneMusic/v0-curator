import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add the formatDate function to the utils file
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

// Function to normalize genre names to match the expected format in validation
export async function normalizeGenre(genre: string): Promise<string> {
  // Map of common genre name variations to their canonical form
  const genreMap: Record<string, string> = {
    "hip hop": "Hip-Hop",
    hiphop: "Hip-Hop",
    "hip-hop": "Hip-Hop",
    "r&b": "R&B",
    randb: "R&B",
    "r and b": "R&B",
    electronic: "Electronic",
    electronica: "Electronic",
    edm: "Electronic",
    // Add more mappings as needed
  }

  // If the genre is in the map, return the canonical form
  const lowerGenre = genre?.toLowerCase()
  if (lowerGenre && genreMap[lowerGenre]) {
    return genreMap[lowerGenre]
  }

  // Otherwise, return the original genre with proper capitalization
  return genre
}

// Function to normalize vocal types to match the expected format in validation
export function normalizeVocal(vocal: string): string {
  // Map of common vocal type variations to their canonical form
  const vocalMap: Record<string, string> = {
    male: "Male",
    female: "Female",
    instrumental: "Instrumental",
    mixed: "Mixed",
    // Add more mappings as needed
  }

  // If the vocal type is in the map, return the canonical form
  const lowerVocal = vocal?.toLowerCase()
  if (lowerVocal && vocalMap[lowerVocal]) {
    return vocalMap[lowerVocal]
  }

  // Otherwise, return the original vocal type with proper capitalization
  return vocal
}

// Function to normalize language names to match the expected format in validation
export function normalizeLanguage(language: string): string {
  // Return the language as-is, since we're now using dynamic validation
  // that should accept any language from the admin panel
  return language
}

// Function to get the name of a variable by its ID
export function getVariableNameById(variables: any[], id: string): string | null {
  const variable = variables.find((v) => v.id === id)
  return variable ? variable.name : null
}
