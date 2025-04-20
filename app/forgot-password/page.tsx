import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { Card, CardContent } from "@/components/ui/card"

export default async function ForgotPasswordPage() {
  // Redirect to dashboard if already logged in
  const user = await getCurrentUser()
  if (user) {
    redirect("/dashboard")
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
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
