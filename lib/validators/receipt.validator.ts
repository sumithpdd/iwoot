/**
 * Receipt Validation Utilities
 */

import { Receipt } from "@/lib/types/receipt"

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateReceipt(
  receipt: Omit<Receipt, "id" | "createdAt" | "updatedAt">
): ValidationResult {
  const errors: string[] = []

  if (!receipt.receiptNumber || receipt.receiptNumber.trim().length === 0) {
    errors.push("Receipt number is required")
  }

  if (!receipt.storeName || receipt.storeName.trim().length === 0) {
    errors.push("Store name is required")
  }

  if (!receipt.receiptDate || !isValidDate(receipt.receiptDate)) {
    errors.push("Valid receipt date is required")
  }

  if (!receipt.items || receipt.items.length === 0) {
    errors.push("Receipt must have at least one item")
  }

  if (receipt.items) {
    receipt.items.forEach((item, index) => {
      if (!item.productId || item.productId.trim().length === 0) {
        errors.push(`Item ${index + 1}: Product ID is required`)
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
      }
      if (item.discountedPrice < 0) {
        errors.push(`Item ${index + 1}: Price cannot be negative`)
      }
    })
  }

  if (receipt.totalAmount < 0) {
    errors.push("Total amount cannot be negative")
  }

  if (!receipt.userId || receipt.userId.trim().length === 0) {
    errors.push("User ID is required")
  }

  // Validate receipt image URL if provided
  if (receipt.receiptImage && !isValidUrl(receipt.receiptImage)) {
    errors.push("Receipt image must be a valid URL")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateReceiptUpdate(
  updates: Partial<Omit<Receipt, "id" | "userId" | "createdAt">>
): ValidationResult {
  const errors: string[] = []

  if (updates.receiptNumber !== undefined) {
    if (!updates.receiptNumber || updates.receiptNumber.trim().length === 0) {
      errors.push("Receipt number cannot be empty")
    }
  }

  if (updates.storeName !== undefined) {
    if (!updates.storeName || updates.storeName.trim().length === 0) {
      errors.push("Store name cannot be empty")
    }
  }

  if (updates.receiptDate !== undefined && !isValidDate(updates.receiptDate)) {
    errors.push("Receipt date must be a valid date")
  }

  if (updates.items !== undefined) {
    if (updates.items.length === 0) {
      errors.push("Receipt must have at least one item")
    }
    updates.items.forEach((item, index) => {
      if (!item.productId || item.productId.trim().length === 0) {
        errors.push(`Item ${index + 1}: Product ID is required`)
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
      }
    })
  }

  if (updates.totalAmount !== undefined && updates.totalAmount < 0) {
    errors.push("Total amount cannot be negative")
  }

  if (updates.receiptImage !== undefined && updates.receiptImage && !isValidUrl(updates.receiptImage)) {
    errors.push("Receipt image must be a valid URL")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

