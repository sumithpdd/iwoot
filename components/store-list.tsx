"use client"

import { useCallback } from "react"
import { Store } from "@/lib/types/store"
import { StoreService } from "@/lib/services/store.service"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { WebsiteLinkPreview } from "@/components/website-link-preview"

type StoreListProps = {
  stores: Store[]
  onChanged: () => void
  onEdit: (store: Store) => void
}

export default function StoreList({ stores, onChanged, onEdit }: StoreListProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const getToken = useCallback(
    () => user?.getIdToken() ?? Promise.resolve(null),
    [user]
  )

  const handleDelete = async (s: Store) => {
    if (!s.id) return
    if (!confirm(`Delete store “${s.name}”? Products/receipts will keep their text fields but lose this link.`)) {
      return
    }
    try {
      await StoreService.deleteStore(getToken, s.id)
      toast({ title: "Deleted", description: "Store removed." })
      onChanged()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Delete failed"
      toast({ title: "Error", description: msg, variant: "destructive" })
    }
  }

  if (stores.length === 0) {
    return (
      <p className="text-center py-10 text-muted-foreground">
        No saved stores yet. Add one to attach to receipts and products.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {stores.map((s) => (
        <div
          key={s.id}
          className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{s.name}</h3>
            {s.address && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.address}</p>
            )}
            {s.phone && <p className="text-sm text-muted-foreground">{s.phone}</p>}
            {s.notes && <p className="text-sm text-muted-foreground">{s.notes}</p>}
            {s.website?.trim() && <WebsiteLinkPreview url={s.website} compact className="max-w-md" />}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(s)}>
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => void handleDelete(s)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
