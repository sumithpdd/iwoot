"use client"

import { useEffect, useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Receipt, ReceiptItem } from "@/lib/types/receipt"
import { Product } from "@/lib/types/product"
import type { Store } from "@/lib/types/store"
import { ReceiptService } from "@/lib/services/receipt.service"
import { ProductService } from "@/lib/services/product.service"
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
import { Loader2, Plus, Trash2 } from "lucide-react"
import ImageUpload from "@/components/image-upload"
import {
  CopyToClipboardButton,
  copyFieldText,
} from "@/components/copy-to-clipboard-button"
import { uploadImagesViaApi } from "@/lib/api/storage-client"
import { newClientEntityId } from "@/lib/utils/client-entity-id"

const receiptSchema = z.object({
  receiptNumber: z.string().min(1, "Receipt number is required"),
  storeName: z.string().min(1, "Store name is required"),
  storeAddress: z.string().optional(),
  storeWebsite: z.union([z.string().url(), z.literal("")]).optional(),
  receiptDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
})

type ReceiptForm = z.infer<typeof receiptSchema>

interface ReceiptDialogProps {
  open: boolean
  onClose: () => void
  /** Called after a successful create/update so the parent can refresh lists without a full-page loader */
  onSaved?: () => void
  receipt?: Receipt | null
  productId?: string // If creating receipt from product
}

export default function ReceiptDialog({
  open,
  onClose,
  onSaved,
  receipt,
  productId,
}: ReceiptDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const getToken = useCallback(
    () => user?.getIdToken() ?? Promise.resolve(null),
    [user]
  )
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<ReceiptItem[]>(
    receipt?.items || (productId ? [{ id: "1", productId, quantity: 1, discountedPrice: 0 }] : [])
  )
  const [receiptImageUrl, setReceiptImageUrl] = useState<string>("")
  const [receiptFileUrl, setReceiptFileUrl] = useState<string>("")
  const [pdfUploading, setPdfUploading] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [linkedStoreId, setLinkedStoreId] = useState("")
  const [entityId, setEntityId] = useState(() => receipt?.id || newClientEntityId())

  useEffect(() => {
    if (!open) return
    setEntityId(receipt?.id || newClientEntityId())
  }, [open, receipt?.id])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReceiptForm>({
    resolver: zodResolver(receiptSchema),
    defaultValues: receipt
      ? {
          receiptNumber: receipt.receiptNumber,
          storeName: receipt.storeName,
          storeAddress: receipt.storeAddress || "",
          storeWebsite: receipt.storeWebsite || "",
          receiptDate: receipt.receiptDate,
          notes: receipt.notes || "",
        }
      : {
          receiptNumber: `RCPT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
          storeName: "",
          storeAddress: "",
          storeWebsite: "",
          receiptDate: new Date().toISOString().split("T")[0],
          notes: "",
        },
  })

  const loadProducts = useCallback(async () => {
    if (!user) return
    try {
      const data = await ProductService.getProducts(getToken, "have")
      setProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }, [user, getToken])

  useEffect(() => {
    if (user) {
      loadProducts()
    }
  }, [user, loadProducts])

  const loadStores = useCallback(async () => {
    if (!user) return
    try {
      const data = await StoreService.getStores(getToken)
      setStores(data)
    } catch (e) {
      console.error("[ReceiptDialog] load stores:", e)
    }
  }, [user, getToken])

  useEffect(() => {
    if (user && open) {
      void loadStores()
    }
  }, [user, open, loadStores])

  useEffect(() => {
    if (receipt) {
      reset({
        receiptNumber: receipt.receiptNumber,
        storeName: receipt.storeName,
        storeAddress: receipt.storeAddress || "",
        storeWebsite: receipt.storeWebsite || "",
        receiptDate: receipt.receiptDate,
        notes: receipt.notes || "",
      })
      setItems(receipt.items)
      setReceiptImageUrl(receipt.receiptImage || "")
      setReceiptFileUrl(receipt.receiptFile || "")
      setLinkedStoreId(receipt.storeId || "")
    } else if (productId) {
      setItems([{ id: "1", productId, quantity: 1, discountedPrice: 0 }])
      setReceiptImageUrl("")
      setReceiptFileUrl("")
      setLinkedStoreId("")
    } else {
      setItems([])
      setReceiptImageUrl("")
      setReceiptFileUrl("")
      setLinkedStoreId("")
    }
  }, [receipt, productId, reset, open])

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        productId: "",
        quantity: 1,
        discountedPrice: 0,
      },
    ])
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const updateItem = (id: string, field: keyof ReceiptItem, value: any) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0)
  }

  const linkedProductId =
    items.find((item) => item.productId)?.productId || productId || undefined

  const handlePdfSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !user) return
    if (file.type !== "application/pdf") {
      toast({
        title: "PDF required",
        description: "Please choose a PDF invoice.",
        variant: "destructive",
      })
      return
    }
    setPdfUploading(true)
    try {
      const [url] = await uploadImagesViaApi(getToken, [file], "receipts", {
        productId: linkedProductId,
        receiptId: entityId,
      })
      setReceiptFileUrl(url)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Upload failed"
      toast({ title: "Upload failed", description: msg, variant: "destructive" })
    } finally {
      setPdfUploading(false)
    }
  }

  const onSubmit = async (data: ReceiptForm) => {
    if (!user) return

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the receipt",
        variant: "destructive",
      })
      return
    }

    try {
      const receiptData = {
        ...data,
        items,
        totalAmount: calculateTotal(),
        userId: user.uid,
        receiptImage: receiptImageUrl || undefined,
        receiptFile: receiptFileUrl || undefined,
        storeId: linkedStoreId.trim() || (receipt?.id ? null : undefined),
        storeAddress: data.storeAddress?.trim() || undefined,
        storeWebsite: data.storeWebsite?.trim() || undefined,
      }

      if (receipt?.id) {
        await ReceiptService.updateReceipt(getToken, receipt.id, receiptData)
        toast({
          title: "Saved",
          description: "Receipt updated.",
        })
      } else {
        await ReceiptService.createReceipt(getToken, receiptData, entityId)
        toast({
          title: "Added",
          description: "Receipt saved.",
        })
      }
      onSaved?.()
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save receipt",
        variant: "destructive",
      })
    }
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSubmitting) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="max-h-[95vh] overflow-y-auto sm:max-w-[900px] lg:max-w-[1000px]"
        onPointerDownOutside={(e) => {
          if (isSubmitting) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{receipt ? "Edit receipt" : "Add receipt"}</DialogTitle>
          <DialogDescription>
            {receipt
              ? "Update line items and totals, then save. Ctrl+Enter (⌘+Enter) saves."
              : "Link items to products you own, then save. Ctrl+Enter (⌘+Enter) saves."}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receiptNumber">Receipt Number</Label>
              <div className="flex gap-1 items-center">
                <Input
                  id="receiptNumber"
                  {...register("receiptNumber")}
                  className="min-w-0 flex-1"
                />
                <CopyToClipboardButton
                  value={copyFieldText(watch("receiptNumber"))}
                  label="Receipt number"
                />
              </div>
              {errors.receiptNumber && (
                <p className="text-sm text-red-500">
                  {errors.receiptNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptDate">Date</Label>
              <div className="flex gap-1 items-center">
                <Input
                  id="receiptDate"
                  type="date"
                  {...register("receiptDate")}
                  className="min-w-0 flex-1"
                />
                <CopyToClipboardButton
                  value={copyFieldText(watch("receiptDate"))}
                  label="Receipt date"
                />
              </div>
              {errors.receiptDate && (
                <p className="text-sm text-red-500">
                  {errors.receiptDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name</Label>
            <div className="flex gap-1 items-center">
              <Input
                id="storeName"
                {...register("storeName")}
                className="min-w-0 flex-1"
              />
              <CopyToClipboardButton
                value={copyFieldText(watch("storeName"))}
                label="Store name"
              />
            </div>
            {errors.storeName && (
              <p className="text-sm text-red-500">
                {errors.storeName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="linked-store">Link to saved store (optional)</Label>
            <select
              id="linked-store"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={linkedStoreId}
              onChange={(e) => {
                const id = e.target.value
                setLinkedStoreId(id)
                const st = stores.find((s) => s.id === id)
                if (st) {
                  setValue("storeName", st.name)
                  setValue("storeAddress", st.address || "")
                  setValue("storeWebsite", st.website || "")
                }
              }}
            >
              <option value="">None</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id!}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Choosing a profile fills the fields below; you can still edit them for this receipt only.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="storeAddress">Store address (optional)</Label>
              <Input
                id="storeAddress"
                {...register("storeAddress")}
                placeholder="As printed on receipt"
                className="min-w-0 flex-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeWebsite">Store website (optional)</Label>
              <div className="flex gap-1 items-center">
                <Input
                  id="storeWebsite"
                  type="url"
                  {...register("storeWebsite")}
                  placeholder="https://…"
                  className="min-w-0 flex-1"
                />
                <CopyToClipboardButton
                  value={copyFieldText(watch("storeWebsite"))}
                  label="Store website"
                />
              </div>
              {errors.storeWebsite && (
                <p className="text-sm text-red-500">{errors.storeWebsite.message as string}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="flex gap-2 p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={item.productId}
                      onChange={(e) =>
                        updateItem(item.id, "productId", e.target.value)
                      }
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - £{product.originalPrice.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "quantity",
                            parseInt(e.target.value) || 1
                          )
                        }
                        min="1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={item.discountedPrice}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "discountedPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="text-right font-semibold">
              Total: £{calculateTotal().toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <div className="flex gap-1 items-center">
              <Input
                id="notes"
                {...register("notes")}
                placeholder="Additional notes..."
                className="min-w-0 flex-1"
              />
              <CopyToClipboardButton
                value={copyFieldText(watch("notes"))}
                label="Notes"
              />
            </div>
          </div>

          {receiptFileUrl && (
            <p className="text-sm">
              <a
                href={receiptFileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline dark:text-blue-400"
              >
                Open invoice PDF
              </a>
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="receipt-pdf">Invoice PDF (optional)</Label>
            <Input
              id="receipt-pdf"
              type="file"
              accept="application/pdf"
              disabled={!user || pdfUploading}
              onChange={(e) => void handlePdfSelect(e)}
            />
          </div>

          <div className="space-y-2">
            <Label>Receipt Image (Optional)</Label>
            <ImageUpload
              images={receiptImageUrl ? [{ url: receiptImageUrl, tags: [] }] : []}
              onImagesChange={(entries) => setReceiptImageUrl(entries[0]?.url ?? "")}
              maxImages={1}
              folder="receipts"
              userId={user?.uid || ""}
              productId={linkedProductId}
              receiptId={entityId}
              disabled={!user}
              allowTags={false}
              allowReorder={false}
            />
          </div>

          <DialogFooter className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[140px] px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : receipt ? (
                "Save changes"
              ) : (
                "Add receipt"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

