import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CuratorTable } from "@/components/admin/curator-table"
import { getAllCurators } from "@/lib/actions/admin-curators"

export default async function CuratorsPage() {
  const { curators = [], success } = await getAllCurators()

  // Ensure curators is always an array
  const safeCurators = Array.isArray(curators) ? curators : []

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Curator Management</h1>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Curators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{safeCurators.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Verified Curators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {safeCurators.filter((curator) => curator && curator.status === "verified").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {safeCurators.reduce(
                (sum, curator) => sum + (Number.parseInt(String(curator?.credits || 0), 10) || 0),
                0,
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Curator Database</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <CuratorTable initialCurators={safeCurators} />
          ) : (
            <div className="p-4 text-center">
              <p className="text-red-500">Failed to load curators. Please try again later.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
