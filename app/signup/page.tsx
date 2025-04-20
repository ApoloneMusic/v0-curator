import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SignupForm } from "@/components/auth/signup-form"
import { Card, CardContent } from "@/components/ui/card"

export default async function SignupPage() {
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
          <SignupForm />
        </CardContent>
      </Card>
    </div>
  )
}
