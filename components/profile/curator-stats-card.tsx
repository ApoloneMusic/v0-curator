import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Star } from "lucide-react"
import type { User } from "@/lib/types"

export function CuratorStatsCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Curator Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-full mr-3 bg-green-100 text-green-800">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{user.accepted || 0}</p>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-full mr-3 bg-red-100 text-red-800">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{user.declined || 0}</p>
                <p className="text-sm text-muted-foreground">Declined</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-full mr-3 bg-yellow-100 text-yellow-800">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{user.curatorScore || 0}</p>
                <p className="text-sm text-muted-foreground">Curator Score</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
