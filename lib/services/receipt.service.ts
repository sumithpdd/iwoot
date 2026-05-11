/**
 * Receipt Service — secured REST APIs only.
 */

import { Receipt } from "@/lib/types/receipt"
import { apiRequest } from "@/lib/api/http"
import { validateReceipt, validateReceiptUpdate } from "@/lib/validators/receipt.validator"

export class ReceiptService {
  static async getReceipts(
    getToken: () => Promise<string | null>
  ): Promise<Receipt[]> {
    try {
      return await apiRequest<Receipt[]>(getToken, "/api/receipts")
    } catch (error: unknown) {
      console.error("[ReceiptService] Error fetching receipts:", error)
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to fetch receipts: ${msg}`)
    }
  }

  static async getReceipt(
    getToken: () => Promise<string | null>,
    receiptId: string
  ): Promise<Receipt | null> {
    if (!receiptId) throw new Error("Valid receiptId is required")
    try {
      return await apiRequest<Receipt>(getToken, `/api/receipts/${receiptId}`)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        return null
      }
      console.error("[ReceiptService] Error fetching receipt:", error)
      throw new Error(`Failed to fetch receipt: ${msg}`)
    }
  }

  static async createReceipt(
    getToken: () => Promise<string | null>,
    receiptData: Omit<Receipt, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const validation = validateReceipt(receiptData)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
    }

    try {
      const res = await apiRequest<{ id: string }>(getToken, "/api/receipts", {
        method: "POST",
        body: JSON.stringify(receiptData),
      })
      return res.id
    } catch (error: unknown) {
      console.error("[ReceiptService] Error creating receipt:", error)
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to create receipt: ${msg}`)
    }
  }

  static async updateReceipt(
    getToken: () => Promise<string | null>,
    receiptId: string,
    updates: Partial<Omit<Receipt, "id" | "userId" | "createdAt">>
  ): Promise<void> {
    if (!receiptId) throw new Error("Valid receiptId is required")

    const validation = validateReceiptUpdate(updates)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
    }

    try {
      await apiRequest(getToken, `/api/receipts/${receiptId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      })
    } catch (error: unknown) {
      console.error("[ReceiptService] Error updating receipt:", error)
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to update receipt: ${msg}`)
    }
  }

  static async deleteReceipt(
    getToken: () => Promise<string | null>,
    receiptId: string
  ): Promise<void> {
    if (!receiptId) throw new Error("Valid receiptId is required")

    try {
      await apiRequest(getToken, `/api/receipts/${receiptId}`, {
        method: "DELETE",
      })
    } catch (error: unknown) {
      console.error("[ReceiptService] Error deleting receipt:", error)
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to delete receipt: ${msg}`)
    }
  }

  static async getReceiptsByProduct(
    getToken: () => Promise<string | null>,
    productId: string
  ): Promise<Receipt[]> {
    if (!productId) throw new Error("Valid productId is required")

    try {
      return await apiRequest<Receipt[]>(
        getToken,
        `/api/receipts/by-product/${encodeURIComponent(productId)}`
      )
    } catch (error: unknown) {
      console.error("[ReceiptService] Error fetching receipts by product:", error)
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to fetch receipts: ${msg}`)
    }
  }
}
