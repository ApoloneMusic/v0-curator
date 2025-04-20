"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function EnvChecker() {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="mt-4">
      <Button variant="outline" size="sm" onClick={() => setShowInfo(!showInfo)}>
        {showInfo ? "Hide Debug Info" : "Show Debug Info"}
      </Button>

      {showInfo && (
        <Alert className="mt-2">
          <AlertDescription>
            <div className="text-xs font-mono">
              <p>NODE_ENV: {process.env.NODE_ENV || "not set"}</p>
              <p>NEXT_PUBLIC_VERCEL_ENV: {process.env.NEXT_PUBLIC_VERCEL_ENV || "not set"}</p>
              <p>Has SPOTIFY_CLIENT_ID: {process.env.SPOTIFY_CLIENT_ID ? "Yes" : "No"}</p>
              <p>Has SPOTIFY_CLIENT_SECRET: {process.env.SPOTIFY_CLIENT_SECRET ? "Yes" : "No"}</p>
              <p>Note: Server-only env vars won't show here</p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
