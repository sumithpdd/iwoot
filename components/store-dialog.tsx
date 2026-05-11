"use client"

import { useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Store } from "@/lib/types/store"
import { StoreService } from "@/lib/services/store.service"
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

const storeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  website: z.union([z.string().url(), z.literal("")]).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

type StoreForm = z.infer<typeof storeSchema>

export type StoreDialogProps = {
  open: boolean
  onClose: () => void
  store?: Store | null
  /** When creating from a receipt, prefill fields */
  initialDraft?: Partial<
    Pick<Store, "name" | "website" | "address" | "phone" | "notes" | "linkedReceiptIds">
  > | null
  onSaved?: (createdId?: string) => void
}

export default function StoreDialog({
  open,
  onClose,
  store,
  initialDraft,
  onSaved,
}: StoreDialogProps) {
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
  } = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
    defaultValues: { name: "", website: "", address: "", phone: "", notes: "" },
  })

  useEffect(() => {
    if (!open) return
    if (store) {
      reset({
        name: store.name,
        website: store.website || "",
        address: store.address || "",
        phone: store.phone || "",
        notes: store.notes || "",
      })
    } else if (initialDraft) {
      reset({
        name: initialDraft.name || "",
        website: initialDraft.website || "",
        address: initialDraft.address || "",
        phone: initialDraft.phone || "",
        notes: initialDraft.notes || "",
      })
    } else {
      reset({ name: "", website: "", address: "", phone: "", notes: "" })
    }
  }, [open, store, initialDraft, reset])

  const onSubmit = async (data: StoreForm) => {
    if (!user) return
    try {
      const trimmed = {
        name: data.name.trim(),
        website: data.website?.trim() || undefined,
        address: data.address?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        userId: user.uid,
        ...(store ? {} : initialDraft?.linkedReceiptIds?.length
          ? { linkedReceiptIds: initialDraft.linkedReceiptIds }
          : {}),
      }

      if (store?.id) {
        const { userId: _uid, ...updates } = trimmed
        await StoreService.updateStore(getToken, store.id, updates)
        toast({ title: "Saved", description: "Store updated." })
        onSaved?.()
      } else {
        const id = await StoreService.createStore(getToken, trimmed as Omit<Store, "id" | "createdAt" | "updatedAt">)
        toast({ title: "Added", description: "Store profile created." })
        onSaved?.(id)
      }
      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save store"
      toast({ title: "Error", description: msg, variant: "destructive" })
    }
  }

  const websiteVal = watch("website")

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isSubmitting) onClose()
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onPointerDownOutside={(e) => {
          if (isSubmitting) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{store ? "Edit store" : "Add store"}</DialogTitle>
          <DialogDescription className="text-left leading-relaxed">
            Save shops or marketplaces where you buy (CeX, Currys, Apple Store, etc.). You can attach a store to “I
            have” items and spawn a profile from a receipt — keeps your resale paperwork tidy.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              void handleSubmit(onSubmit)()
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="store-name">Store name *</Label>
            <div className="flex gap-1">
              <Input id="store-name" {...register("name")} className="min-w-0 flex-1" />
              <CopyToClipboardButton value={copyFieldText(watch("name"))} label="Store name" />
            </div>
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-website">Website (optional)</Label>
            <div className="flex gap-1">
              <Input
                id="store-website"
                type="url"
                placeholder="https://…"
                {...register("website")}
                className="min-w-0 flex-1"
              />
              <CopyToClipboardButton value={copyFieldText(watch("website"))} label="Website" />
            </div>
            {errors.website && (
              <p className="text-sm text-red-500">{errors.website.message as string}</p>
            )}
            {(websiteVal || "").trim() ? (
              <WebsiteLinkPreview url={String(websiteVal)} compact className="mt-1" />
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-address">Address (optional)</Label>
            <Input id="store-address" {...register("address")} placeholder="Street, city…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-phone">Phone (optional)</Label>
            <Input id="store-phone" {...register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-notes">Notes (optional)</Label>
            <Input id="store-notes" {...register("notes")} />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : store ? (
                "Save"
              ) : (
                "Create store"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
