"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Receipt, ReceiptItem } from "@/lib/types/receipt"
import { Product } from "@/lib/types/product"
import { createReceipt, updateReceipt } from "@/lib/firebase/receipts"
import { getProducts } from "@/lib/firebase/products"
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
import { Plus, Trash2 } from "lucide-react"
import ImageUpload from "@/components/image-upload"

const receiptSchema = z.object({
  receiptNumber: z.string().min(1, "Receipt number is required"),
  storeName: z.string().min(1, "Store name is required"),
  receiptDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
})

type ReceiptForm = z.infer<typeof receiptSchema>

interface ReceiptDialogProps {
  open: boolean
  onClose: () => void
  receipt?: Receipt | null
  productId?: string // If creating receipt from product
}

export default function ReceiptDialog({
  open,
  onClose,
  receipt,
  productId,
}: ReceiptDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<ReceiptItem[]>(
    receipt?.items || (productId ? [{ id: "1", productId, quantity: 1, discountedPrice: 0 }] : [])
  )
  const [receiptImageUrl, setReceiptImageUrl] = useState<string>("")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReceiptForm>({
    resolver: zodResolver(receiptSchema),
    defaultValues: receipt
      ? {
          receiptNumber: receipt.receiptNumber,
          storeName: receipt.storeName,
          receiptDate: receipt.receiptDate,
          notes: receipt.notes || "",
        }
      : {
          receiptNumber: `RCPT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
          storeName: "",
          receiptDate: new Date().toISOString().split("T")[0],
          notes: "",
        },
  })

  useEffect(() => {
    if (user) {
      loadProducts()
    }
  }, [user])

  useEffect(() => {
    if (receipt) {
      reset({
        receiptNumber: receipt.receiptNumber,
        storeName: receipt.storeName,
        receiptDate: receipt.receiptDate,
        notes: receipt.notes || "",
      })
      setItems(receipt.items)
      setReceiptImageUrl(receipt.receiptImage || "")
    } else if (productId) {
      setItems([{ id: "1", productId, quantity: 1, discountedPrice: 0 }])
      setReceiptImageUrl("")
    } else {
      setItems([])
      setReceiptImageUrl("")
    }
  }, [receipt, productId, reset, open])

  const loadProducts = async () => {
    if (!user) return
    try {
      const data = await getProducts(user.uid, "have")
      setProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

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
      }

      if (receipt?.id) {
        await updateReceipt(receipt.id, receiptData)
        toast({
          title: "Success",
          description: "Receipt updated successfully",
        })
      } else {
        await createReceipt(receiptData)
        toast({
          title: "Success",
          description: "Receipt created successfully",
        })
      }
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save receipt",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] lg:max-w-[1000px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {receipt ? "Edit Receipt" : "Add Receipt"}
          </DialogTitle>
          <DialogDescription>
            {receipt
              ? "Update the receipt information"
              : "Add a new receipt for your purchase"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receiptNumber">Receipt Number</Label>
              <Input id="receiptNumber" {...register("receiptNumber")} />
              {errors.receiptNumber && (
                <p className="text-sm text-red-500">
                  {errors.receiptNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptDate">Date</Label>
              <Input id="receiptDate" type="date" {...register("receiptDate")} />
              {errors.receiptDate && (
                <p className="text-sm text-red-500">
                  {errors.receiptDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name</Label>
            <Input id="storeName" {...register("storeName")} />
            {errors.storeName && (
              <p className="text-sm text-red-500">
                {errors.storeName.message}
              </p>
            )}
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
            <Input id="notes" {...register("notes")} placeholder="Additional notes..." />
          </div>

          <div className="space-y-2">
            <Label>Receipt Image (Optional)</Label>
            <ImageUpload
              images={receiptImageUrl ? [receiptImageUrl] : []}
              onImagesChange={(urls) => setReceiptImageUrl(urls[0] || "")}
              maxImages={1}
              folder="receipts"
              userId={user?.uid || ""}
              disabled={!user}
            />
          </div>

          <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? "Saving..." : receipt ? "Update Receipt" : "Create Receipt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

