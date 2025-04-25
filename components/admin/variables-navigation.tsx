"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { VariableCategory } from "@/lib/variables"
import { Download } from "lucide-react"

interface VariablesNavigationProps {
  currentCategory?: VariableCategory | "import-export"
}

export function VariablesNavigation({ currentCategory }: VariablesNavigationProps) {
  const router = useRouter()

  const categories: { id: VariableCategory | "import-export"; name: string }[] = [
    { id: "genres", name: "Genres" },
    { id: "subgenres", name: "Subgenres" },
    { id: "moods", name: "Moods" },
    { id: "tempos", name: "Tempos" },
    { id: "vocals", name: "Vocals" },
    { id: "eras", name: "Eras" },
    { id: "languages", name: "Languages" },
    { id: "import-export", name: "Import/Export" },
  ]

  const navigateTo = (category: VariableCategory | "import-export") => {
    if (category === currentCategory) return

    if (category === "import-export") {
      router.push(`/admin/dashboard/variables/import-export`)
    } else {
      router.push(`/admin/dashboard/variables/${category}`)
    }
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={currentCategory === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => navigateTo(category.id)}
          className={category.id === "import-export" ? "ml-auto" : ""}
        >
          {category.id === "import-export" && <Download className="mr-2 h-4 w-4" />}
          {category.name}
        </Button>
      ))}
    </div>
  )
}
