"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  const [fastTrackEnabled, setFastTrackEnabled] = useState(false)

  useEffect(() => {
    const storedValue = localStorage.getItem("fastTrackEnabled")
    setFastTrackEnabled(storedValue === "true")
  }, [])

  const handleFastTrackToggle = (checked) => {
    setFastTrackEnabled(checked)
    localStorage.setItem("fastTrackEnabled", checked)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Game Dashboard Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="fast-track"
              checked={fastTrackEnabled}
              onCheckedChange={handleFastTrackToggle}
            />
            <Label htmlFor="fast-track">Enable Fast Track</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}