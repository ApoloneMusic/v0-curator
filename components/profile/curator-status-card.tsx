import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Award, AlertCircle } from "lucide-react"
import type { User } from "@/lib/types"

export function CuratorStatusCard({ user }: { user: User }) {
  // Get status badge color
  const getStatusBadgeColor = () => {
    if (!user.status) return "bg-gray-200 text-gray-800"

    switch (user.status) {
      case "verified":
        return "bg-green-100 text-green-800"
      case "unverified":
        return "bg-yellow-100 text-yellow-800"
      case "declined":
        return "bg-red-100 text-red-800"
      case "suspicious":
        return "bg-orange-100 text-orange-800"
      case "blocked":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  // Get status icon
  const getStatusIcon = () => {
    if (!user.status) return <AlertCircle className="h-5 w-5" />

    switch (user.status) {
      case "verified":
        return <Award className="h-5 w-5" />
      case "unverified":
      case "declined":
      case "suspicious":
      case "blocked":
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  // Get status description
  const getStatusDescription = () => {
    if (!user.status) return "Your account status is unknown."

    switch (user.status) {
      case "verified":
        return "Your account is verified and in good standing."
      case "unverified":
        return "Your account is pending verification."
      case "declined":
        return "Your account verification was declined."
      case "suspicious":
        return "Your account has been flagged for suspicious activity."
      case "blocked":
        return "Your account has been blocked."
      default:
        return "Your account status is unknown."
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Account Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-2 rounded-full mr-3 ${getStatusBadgeColor()}`}>{getStatusIcon()}</div>
              <div>
                <p className="font-medium">
                  {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : "Unknown"}
                </p>
                <p className="text-sm text-muted-foreground">{getStatusDescription()}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center">
              <div className="p-2 rounded-full mr-3 bg-accent/20 text-accent-foreground">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{user.credits || 0} Credits</p>
                <p className="text-sm text-muted-foreground">Available balance</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
