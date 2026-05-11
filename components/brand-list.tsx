"use client"

import { useCallback } from "react"
import type { Brand } from "@/lib/types/brand"
import { BrandService } from "@/lib/services/brand.service"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { WebsiteLinkPreview } from "@/components/website-link-preview"

type BrandListProps = {
  brands: Brand[]
  onChanged: () => void
  onEdit: (brand: Brand) => void
}

export default function BrandList({ brands, onChanged, onEdit }: BrandListProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const getToken = useCallback(
    () => user?.getIdToken() ?? Promise.resolve(null),
    [user]
  )

  const handleDelete = async (b: Brand) => {
    if (!b.id) return
    if (!confirm(`Delete brand “${b.name}”? Products keep the text “brand” field but lose this link.`)) {
      return
    }
    try {
      await BrandService.deleteBrand(getToken, b.id)
      toast({ title: "Deleted", description: "Brand removed." })
      onChanged()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Delete failed"
      toast({ title: "Error", description: msg, variant: "destructive" })
    }
  }

  if (brands.length === 0) {
    return (
      <p className="text-center py-10 text-muted-foreground">
        No saved brands yet. Add one to link from products (e.g. Apple, Sony).
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {brands.map((b) => (
        <div
          key={b.id}
          className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{b.name}</h3>
            {b.notes && <p className="text-sm text-muted-foreground">{b.notes}</p>}
            {b.website?.trim() && <WebsiteLinkPreview url={b.website} compact className="max-w-md" />}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(b)}>
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => void handleDelete(b)}
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
