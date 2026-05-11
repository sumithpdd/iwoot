"use client"

import { useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Database } from "lucide-react"

type Props = {
  /** When true, omit pre-filled listing platforms (still creates Apple brand + product) */
  minimalListing?: boolean
  onSeeded?: () => void
}

export function SeedAirpodsDemoButton({ minimalListing = false, onSeeded }: Props) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  const run = useCallback(async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Log in on the dashboard first.", variant: "destructive" })
      return
    }
    setBusy(true)
    try {
      const token = await user.getIdToken()
      const q = minimalListing ? "?listing=0" : ""
      const res = await fetch(`/api/seed/airpods-pro-2${q}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const text = await res.text()
      let body: { error?: string; productId?: string; brandId?: string; reusedExistingAppleBrand?: boolean } = {}
      try {
        body = JSON.parse(text) as typeof body
      } catch {
        /* ignore */
      }
      if (!res.ok) {
        throw new Error(body.error || text || res.statusText)
      }
      toast({
        title: "Seeded",
        description: body.reusedExistingAppleBrand
          ? "Linked to your existing “Apple” brand and added a demo AirPods Pro 2 product."
          : "Created an “Apple” brand profile and a demo AirPods Pro 2 product.",
      })
      onSeeded?.()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Seed failed"
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }, [user, toast, minimalListing, onSeeded])

  return (
    <Button type="button" variant="secondary" disabled={busy || !user} onClick={() => void run()}>
      {busy ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Database className="mr-2 h-4 w-4" aria-hidden />
      )}
      Seed demo (Apple + AirPods Pro 2)
    </Button>
  )
}
