import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent } from "@/components/ui/card"

export default async function LoginPage() {
  // Redirect to dashboard if already logged in
  const user = await getCurrentUser()
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 relative">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6 px-8 pb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">
              <span className="text-primary">Apolone</span>
              <span className="text-secondary">.</span>
            </h1>
          </div>
          <LoginForm />
        </CardContent>
      </Card>

      {/* Admin link in bottom right corner */}
      <div className="absolute bottom-4 right-4">
        <Link href="/admin/login" className="text-secondary hover:text-secondary/80 font-medium text-lg">
          Admin
        </Link>
      </div>
    </div>
  )
}
