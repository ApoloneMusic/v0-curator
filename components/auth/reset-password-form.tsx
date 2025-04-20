"use client"

import { useState } from "react"
import Link from "next/link"
import { useActionState } from "react"
import { resetPassword } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"

export function ResetPasswordForm({ token }: { token: string }) {
  const [isPending, setIsPending] = useState(false)
  const resetPasswordWithToken = (prevState: any, formData: FormData) => resetPassword(token, prevState, formData)
  const [state, formAction] = useActionState(resetPasswordWithToken, { error: {}, success: false })

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
        <p className="text-muted-foreground">Enter your new password</p>
      </div>

      {state.success ? (
        <div className="space-y-4">
          <Alert>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
          <div className="text-center">
            <Link href="/login">
              <Button className="mt-4">Go to Login</Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" name="password" type="password" required autoComplete="new-password" />
              {state.error.password && <p className="text-sm text-destructive">{state.error.password[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
              {state.error.confirmPassword && (
                <p className="text-sm text-destructive">{state.error.confirmPassword[0]}</p>
              )}
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
                  Resetting password...
                </>
              ) : (
                "Reset Password"
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
