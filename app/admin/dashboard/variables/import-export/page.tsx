import { VariablesImportExport } from "@/components/admin/variables-import-export"
import { VariablesNavigation } from "@/components/admin/variables-navigation"

export default function ImportExportVariablesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Import/Export Variables</h1>

      <VariablesNavigation currentCategory="import-export" />

      <div className="mt-6">
        <VariablesImportExport />
      </div>
    </div>
  )
}
