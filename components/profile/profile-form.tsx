"use client"

import { useState } from "react"
import { useActionState } from "react"
import { updateProfile } from "@/lib/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ReloadIcon } from "@radix-ui/react-icons"
import type { User } from "@/lib/types"

export function ProfileForm({ user }: { user: User }) {
  const [isPending, setIsPending] = useState(false)
  const [state, formAction] = useActionState(updateProfile, { error: {}, success: false })

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

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!user || !user.name) return "CU"

    return (
      user.name
        .split(" ")
        .filter((part) => part.length > 0)
        .map((part) => part[0] || "")
        .join("")
        .toUpperCase()
        .substring(0, 2) || "CU"
    )
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center space-y-2 mb-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src="/vibrant-street-market.png" alt={user.name} />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
        <Button variant="outline" size="sm">
          Change Avatar
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" defaultValue={user.name} />
          {state.error?.name && <p className="text-sm text-destructive">{state.error.name[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="curatorNick">
            Curator Nickname
            <span className="text-muted-foreground ml-1 text-xs">(visible to others)</span>
          </Label>
          <Input
            id="curatorNick"
            name="curatorNick"
            defaultValue={user.curatorNick || ""}
            placeholder="yourcuratornick"
          />
          {state.error?.curatorNick && <p className="text-sm text-destructive">{state.error.curatorNick[0]}</p>}
          <p className="text-xs text-muted-foreground">Only letters, numbers, and underscores</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input id="phoneNumber" name="phoneNumber" defaultValue={user.phoneNumber || ""} placeholder="+1234567890" />
          {state.error?.phoneNumber && <p className="text-sm text-destructive">{state.error.phoneNumber[0]}</p>}
        </div>

        {state.error?._form && (
          <Alert variant="destructive">
            <AlertDescription>{state.error._form[0]}</AlertDescription>
          </Alert>
        )}

        {state.success && state.message && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  )
}
