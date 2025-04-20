"use client"

import { useState } from "react"
import Link from "next/link"
import { useActionState } from "react"
import { requestPasswordReset } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"

export function ForgotPasswordForm() {
  const [isPending, setIsPending] = useState(false)
  const [state, formAction] = useActionState(requestPasswordReset, { error: {}, success: false })

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    try {
      await formAction(formData)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Reset Password</h1>
        <p className="text-muted-foreground">Enter your email to receive a password reset link</p>
      </div>

      {state.success ? (
        <div className="space-y-4">
          <Alert>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>

          {/* For demo purposes only, remove in production */}
          {state.token && (
            <div className="p-4 border rounded-md bg-muted">
              <p className="text-sm font-medium mb-2">Demo Reset Link:</p>
              <Link
                href={`/reset-password?token=${state.token}`}
                className="text-sm text-primary break-all hover:underline"
              >
                /reset-password?token={state.token}
              </Link>
            </div>
          )}

          <div className="text-center">
            <Link href="/login">
              <Button variant="outline" className="mt-4">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="your@email.com" required autoComplete="email" />
              {state.error.email && <p className="text-sm text-destructive">{state.error.email[0]}</p>}
            </div>

            {state.error._form && (
              <Alert variant="destructive">
                <AlertDescription>{state.error._form[0]}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  )
}
