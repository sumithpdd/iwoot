"use client"

import { useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { Brand } from "@/lib/types/brand"
import { BrandService } from "@/lib/services/brand.service"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import {
  CopyToClipboardButton,
  copyFieldText,
} from "@/components/copy-to-clipboard-button"
import { WebsiteLinkPreview } from "@/components/website-link-preview"

const brandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  website: z.union([z.string().url(), z.literal("")]).optional(),
  notes: z.string().optional(),
})

type BrandForm = z.infer<typeof brandSchema>

export type BrandDialogProps = {
  open: boolean
  onClose: () => void
  brand?: Brand | null
  onSaved?: (createdId?: string) => void
}

export default function BrandDialog({ open, onClose, brand, onSaved }: BrandDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const getToken = useCallback(
    () => user?.getIdToken() ?? Promise.resolve(null),
    [user]
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BrandForm>({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: "", website: "", notes: "" },
  })

  useEffect(() => {
    if (!open) return
    if (brand) {
      reset({
        name: brand.name,
        website: brand.website || "",
        notes: brand.notes || "",
      })
    } else {
      reset({ name: "", website: "", notes: "" })
    }
  }, [open, brand, reset])

  const onSubmit = async (data: BrandForm) => {
    if (!user) return
    try {
      const trimmed = {
        name: data.name.trim(),
        website: data.website?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        userId: user.uid,
      }

      if (brand?.id) {
        const { userId: _uid, ...updates } = trimmed
        await BrandService.updateBrand(getToken, brand.id, updates)
        toast({ title: "Saved", description: "Brand updated." })
        onSaved?.()
      } else {
        const id = await BrandService.createBrand(
          getToken,
          trimmed as Omit<Brand, "id" | "createdAt" | "updatedAt">
        )
        toast({ title: "Added", description: "Brand profile created." })
        onSaved?.(id)
      }
      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed"
      toast({ title: "Error", description: msg, variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isSubmitting && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (isSubmitting) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{brand ? "Edit brand" : "Add brand"}</DialogTitle>
          <DialogDescription>
            Brands are normalised profiles you can link from any product (e.g. Apple, Sony).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Name *</Label>
            <div className="flex gap-1">
              <Input id="brand-name" {...register("name")} placeholder="e.g. Apple" />
              <CopyToClipboardButton value={copyFieldText(watch("name"))} label="Brand name" />
            </div>
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-website">Website (optional)</Label>
            <div className="flex gap-1">
              <Input id="brand-website" type="url" {...register("website")} placeholder="https://…" />
              <CopyToClipboardButton value={copyFieldText(watch("website"))} label="Website" />
            </div>
            {errors.website && <p className="text-sm text-red-500">{errors.website.message}</p>}
            {(watch("website") || "").trim() && (
              <WebsiteLinkPreview url={String(watch("website"))} compact className="max-w-md" />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-notes">Notes (optional)</Label>
            <Input id="brand-notes" {...register("notes")} placeholder="Short reminder" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : brand ? (
                "Save"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
