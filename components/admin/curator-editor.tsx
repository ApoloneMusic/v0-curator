"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ReloadIcon } from "@radix-ui/react-icons"
import { updateCurator } from "@/lib/actions/admin-curators"

interface Curator {
  id: string
  name?: string
  email?: string
  curatorNick?: string
  phoneNumber?: string
  status?: string
  credits?: string | number
  accepted?: string | number
  declined?: string | number
  curatorScore?: string | number
  playlists?: string[]
}

interface CuratorEditorProps {
  curator: Curator
  onUpdate: (curator: Curator) => void
}

export function CuratorEditor({ curator, onUpdate }: CuratorEditorProps) {
  const [curatorData, setCuratorData] = useState<Curator>({ ...curator })
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<any>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleChange = (field: keyof Curator, value: any) => {
    setCuratorData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNumberChange = (field: keyof Curator, value: string) => {
    const numValue = value === "" ? 0 : Number.parseInt(value, 10)
    if (!isNaN(numValue)) {
      handleChange(field, numValue)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await updateCurator(curatorData)

      if (result.success) {
        setSuccess(result.message || "Curator updated successfully")
        onUpdate(curatorData)
      } else {
        setError(result.error || "Failed to update curator")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Curator</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id">Curator ID</Label>
            <Input id="id" value={curatorData.id || ""} disabled className="bg-muted font-mono text-xs" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={curatorData.name || ""} onChange={(e) => handleChange("name", e.target.value)} />
            {error?.name && <p className="text-sm text-destructive">{error.name[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={curatorData.email || ""} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="curatorNick">Curator Nickname</Label>
            <Input
              id="curatorNick"
              value={curatorData.curatorNick || ""}
              onChange={(e) => handleChange("curatorNick", e.target.value)}
              placeholder="yourcuratornick"
            />
            {error?.curatorNick && <p className="text-sm text-destructive">{error.curatorNick[0]}</p>}
            <p className="text-xs text-muted-foreground">Only letters, numbers, and underscores</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={curatorData.phoneNumber || ""}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              placeholder="+1234567890"
            />
            {error?.phoneNumber && <p className="text-sm text-destructive">{error.phoneNumber[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={curatorData.status || "unverified"}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="unverified">Unverified</option>
              <option value="verified">Verified</option>
              <option value="declined">Declined</option>
              <option value="suspicious">Suspicious</option>
              <option value="blocked">Blocked</option>
            </select>
            {error?.status && <p className="text-sm text-destructive">{error.status[0]}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                value={curatorData.credits || 0}
                onChange={(e) => handleNumberChange("credits", e.target.value)}
                min={0}
              />
              {error?.credits && <p className="text-sm text-destructive">{error.credits[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="curatorScore">Curator Score</Label>
              <Input
                id="curatorScore"
                type="number"
                value={curatorData.curatorScore || 0}
                onChange={(e) => handleNumberChange("curatorScore", e.target.value)}
                min={0}
              />
              {error?.curatorScore && <p className="text-sm text-destructive">{error.curatorScore[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accepted">Accepted</Label>
              <Input
                id="accepted"
                type="number"
                value={curatorData.accepted || 0}
                onChange={(e) => handleNumberChange("accepted", e.target.value)}
                min={0}
              />
              {error?.accepted && <p className="text-sm text-destructive">{error.accepted[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="declined">Declined</Label>
              <Input
                id="declined"
                type="number"
                value={curatorData.declined || 0}
                onChange={(e) => handleNumberChange("declined", e.target.value)}
                min={0}
              />
              {error?.declined && <p className="text-sm text-destructive">{error.declined[0]}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="playlists">Playlists</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="playlists"
                value={Array.isArray(curatorData.playlists) ? curatorData.playlists.length : 0}
                disabled
                className="bg-muted"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(`/admin/dashboard/playlists?curator=${curatorData.id}`, "_blank")}
              >
                View
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Number of playlists associated with this curator</p>
          </div>

          {error?._form && (
            <Alert variant="destructive">
              <AlertDescription>{error._form[0]}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
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
        </form>
      </CardContent>
    </Card>
  )
}
