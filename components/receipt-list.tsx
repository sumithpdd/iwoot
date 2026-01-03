"use client"

import { Receipt } from "@/lib/types/receipt"
import { deleteReceipt } from "@/lib/firebase/receipts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Receipt as ReceiptIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface ReceiptListProps {
  receipts: Receipt[]
  onEdit: (receipt: Receipt) => void
  onDelete: () => void
}

export default function ReceiptList({
  receipts,
  onEdit,
  onDelete,
}: ReceiptListProps) {
  const { toast } = useToast()

  const handleDelete = async (receiptId: string) => {
    if (!confirm("Are you sure you want to delete this receipt?")) {
      return
    }

    try {
      await deleteReceipt(receiptId)
      toast({
        title: "Success",
        description: "Receipt deleted successfully",
      })
      onDelete()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete receipt",
        variant: "destructive",
      })
    }
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center py-12">
        <ReceiptIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No receipts yet. Add your first receipt!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {receipts.map((receipt) => (
        <Card key={receipt.id}>
          <CardHeader>
            <CardTitle className="text-lg">{receipt.receiptNumber}</CardTitle>
            <CardDescription>{receipt.storeName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date:</span>
                <span>{format(new Date(receipt.receiptDate), "MMM dd, yyyy")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items:</span>
                <span>{receipt.items.length}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Total:</span>
                <span>£{receipt.totalAmount.toFixed(2)}</span>
              </div>
              {receipt.notes && (
                <p className="text-sm text-gray-600 mt-2">{receipt.notes}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(receipt)}
                className="flex-1"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => receipt.id && handleDelete(receipt.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

