import { redirect } from "next/navigation"
import { getCurrentUser, validatePasswordResetToken } from "@/lib/auth"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  // Redirect to dashboard if already logged in
  const user = await getCurrentUser()
  if (user) {
    redirect("/dashboard")
  }

  const { token } = searchParams

  // Validate token
  let isValidToken = false
  if (token) {
    const userId = await validatePasswordResetToken(token)
    isValidToken = !!userId
  }

  if (!token || !isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 px-8 pb-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold">
                <span className="text-primary">Apolone</span>
                <span className="text-secondary">.</span>
              </h1>
            </div>
            <div className="space-y-6">
              <Alert variant="destructive">
                <AlertDescription>Invalid or expired password reset token.</AlertDescription>
              </Alert>
              <div className="text-center">
                <Link href="/forgot-password">
                  <Button className="mt-4">Request New Reset Link</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6 px-8 pb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">
              <span className="text-primary">Apolone</span>
              <span className="text-secondary">.</span>
            </h1>
          </div>
          <ResetPasswordForm token={token} />
        </CardContent>
      </Card>
    </div>
  )
}
