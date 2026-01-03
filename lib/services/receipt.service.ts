/**
 * Receipt Service Layer
 * 
 * Service layer for receipt operations.
 * Handles business logic and validation.
 */

import { Receipt } from "@/lib/types/receipt"
import * as receiptRepository from "@/lib/firebase/receipts"
import { validateReceipt, validateReceiptUpdate } from "@/lib/validators/receipt.validator"

export class ReceiptService {
  /**
   * Get all receipts for a user
   */
  static async getReceipts(userId: string): Promise<Receipt[]> {
    if (!userId || typeof userId !== "string") {
      throw new Error("Valid userId is required")
    }

    try {
      return await receiptRepository.getReceipts(userId)
    } catch (error: any) {
      console.error("[ReceiptService] Error fetching receipts:", error)
      throw new Error(`Failed to fetch receipts: ${error.message}`)
    }
  }

  /**
   * Get a single receipt by ID
   */
  static async getReceipt(receiptId: string): Promise<Receipt | null> {
    if (!receiptId || typeof receiptId !== "string") {
      throw new Error("Valid receiptId is required")
    }

    try {
      return await receiptRepository.getReceipt(receiptId)
    } catch (error: any) {
      console.error("[ReceiptService] Error fetching receipt:", error)
      throw new Error(`Failed to fetch receipt: ${error.message}`)
    }
  }

  /**
   * Create a new receipt
   */
  static async createReceipt(
    receiptData: Omit<Receipt, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const validation = validateReceipt(receiptData)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
    }

    try {
      return await receiptRepository.createReceipt(receiptData)
    } catch (error: any) {
      console.error("[ReceiptService] Error creating receipt:", error)
      throw new Error(`Failed to create receipt: ${error.message}`)
    }
  }

  /**
   * Update an existing receipt
   */
  static async updateReceipt(
    receiptId: string,
    updates: Partial<Omit<Receipt, "id" | "userId" | "createdAt">>
  ): Promise<void> {
    if (!receiptId || typeof receiptId !== "string") {
      throw new Error("Valid receiptId is required")
    }

    const validation = validateReceiptUpdate(updates)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
    }

    try {
      await receiptRepository.updateReceipt(receiptId, updates)
    } catch (error: any) {
      console.error("[ReceiptService] Error updating receipt:", error)
      throw new Error(`Failed to update receipt: ${error.message}`)
    }
  }

  /**
   * Delete a receipt
   */
  static async deleteReceipt(receiptId: string): Promise<void> {
    if (!receiptId || typeof receiptId !== "string") {
      throw new Error("Valid receiptId is required")
    }

    try {
      await receiptRepository.deleteReceipt(receiptId)
    } catch (error: any) {
      console.error("[ReceiptService] Error deleting receipt:", error)
      throw new Error(`Failed to delete receipt: ${error.message}`)
    }
  }

  /**
   * Get receipts for a specific product
   */
  static async getReceiptsByProduct(productId: string): Promise<Receipt[]> {
    if (!productId || typeof productId !== "string") {
      throw new Error("Valid productId is required")
    }

    try {
      return await receiptRepository.getReceiptsByProduct(productId)
    } catch (error: any) {
      console.error("[ReceiptService] Error fetching receipts by product:", error)
      throw new Error(`Failed to fetch receipts: ${error.message}`)
    }
  }
}

