"use client"

import { useState, useCallback } from "react"
import { Store } from "@/lib/types/store"
import { StoreService } from "@/lib/services/store.service"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Store as StoreIcon } from "lucide-react"

type SuggestedStoresSeedProps = {
  stores: Store[]
  onSeeded: () => void
}

export function SuggestedStoresSeed({ stores, onSeeded }: SuggestedStoresSeedProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const getToken = useCallback(
    () => user?.getIdToken() ?? Promise.resolve(null),
    [user]
  )

  const handleSeed = async () => {
    if (!user) return
    setBusy(true)
    try {
      const n = await StoreService.seedSuggestedRetailers(getToken, user.uid, stores)
      if (n === 0) {
        toast({
          title: "Nothing to add",
          description: "Suggested retailers are already in your list (by name).",
        })
      } else {
        toast({
          title: "Stores added",
          description: `Created ${n} new store profile(s). You can edit or delete any of them.`,
        })
        onSeeded()
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not add stores"
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" disabled={!user || busy} onClick={() => void handleSeed()}>
      <StoreIcon className="mr-2 h-4 w-4" aria-hidden />
      {busy ? "Adding…" : "Add suggested retailers"}
    </Button>
  )
}
