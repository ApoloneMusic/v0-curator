"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { signup } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"

export function SignupForm() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [state, formAction] = useActionState(signup, { error: {}, success: false })

  // Handle redirect if signup is successful
  useEffect(() => {
    if (state?.success && state?.redirectUrl) {
      router.push(state.redirectUrl)
    }
  }, [state, router])

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    try {
      await formAction(formData)
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p className="text-muted-foreground">Enter your information to create an account</p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" placeholder="John Doe" required autoComplete="name" />
          {state?.error?.name && <p className="text-sm text-destructive">{state.error.name[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="your@email.com" required autoComplete="email" />
          {state?.error?.email && <p className="text-sm text-destructive">{state.error.email[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required autoComplete="new-password" />
          {state?.error?.password && <p className="text-sm text-destructive">{state.error.password[0]}</p>}
        </div>

        {state?.error?._form && (
          <Alert variant="destructive">
            <AlertDescription>{state.error._form[0]}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
