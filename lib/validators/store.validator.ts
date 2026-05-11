import { Store } from "@/lib/types/store"

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateStore(
  store: Omit<Store, "id" | "createdAt" | "updatedAt">
): ValidationResult {
  const errors: string[] = []

  if (!store.name || store.name.trim().length === 0) {
    errors.push("Store name is required")
  }

  if (store.website?.trim() && !isValidUrl(store.website.trim())) {
    errors.push("Website must be a valid URL")
  }

  if (!store.userId || store.userId.trim().length === 0) {
    errors.push("User ID is required")
  }

  if (store.linkedReceiptIds && !Array.isArray(store.linkedReceiptIds)) {
    errors.push("linkedReceiptIds must be an array when provided")
  }

  return { valid: errors.length === 0, errors }
}

export function validateStoreUpdate(
  updates: Partial<Omit<Store, "id" | "userId" | "createdAt">>
): ValidationResult {
  const errors: string[] = []

  if (updates.name !== undefined && (!updates.name || updates.name.trim().length === 0)) {
    errors.push("Store name cannot be empty")
  }

  if (updates.website !== undefined && updates.website && !isValidUrl(updates.website.trim())) {
    errors.push("Website must be a valid URL")
  }

  if (updates.linkedReceiptIds !== undefined && !Array.isArray(updates.linkedReceiptIds)) {
    errors.push("linkedReceiptIds must be an array")
  }

  return { valid: errors.length === 0, errors }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
