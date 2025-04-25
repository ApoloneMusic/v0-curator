import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"
import type { VariableCategory } from "@/lib/variables"

interface VariablesValidationRulesProps {
  category: VariableCategory
}

export function VariablesValidationRules({ category }: VariablesValidationRulesProps) {
  // Define rules for each variable category
  const rules: Record<VariableCategory, string[]> = {
    genres: [
      "Each genre must have a unique ID and name",
      "Genre IDs should be lowercase with no spaces (use underscores)",
      "Genre names should be concise and descriptive",
      "Genres are used as the primary music categorization",
    ],
    subgenres: [
      "Each subgenre must be associated with a parent genre",
      "Subgenre IDs should be lowercase with no spaces (use underscores)",
      "At least 3 subgenres must be selected for each playlist",
    ],
    moods: [
      "Mood options should describe the emotional quality of music",
      "At least one mood must be selected for each playlist",
    ],
    tempos: [
      "Tempo options should include the BPM (beats per minute) range",
      "Standard tempo classifications should be used (e.g., Slow, Medium, Fast)",
    ],
    vocals: [
      "Vocal options describe the vocal characteristics",
      "Include options like Male, Female, Instrumental, Mixed",
    ],
    eras: ["Era options represent time periods or decades", "At least one era must be selected for each playlist"],
    languages: [
      "Language options represent the primary language of the vocals",
      "Only one language can be selected per playlist",
    ],
  }

  return (
    <Alert className="bg-blue-50 border-blue-200 text-blue-800 mb-6">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle>Validation Rules</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
          {rules[category].map((rule, index) => (
            <li key={index}>{rule}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
