/**
 * Product Validation Utilities
 * 
 * Centralized validation logic for products.
 * Uses Zod-like validation patterns for consistency.
 */

import { Product, WantProduct, HaveProduct } from "@/lib/types/product"

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate a product before creation
 */
export function validateProduct(
  product: Omit<Product, "id" | "createdAt" | "updatedAt">
): ValidationResult {
  const errors: string[] = []

  // Required fields
  if (!product.name || product.name.trim().length === 0) {
    errors.push("Product name is required")
  }

  if (!product.brand || product.brand.trim().length === 0) {
    errors.push("Brand is required")
  }

  if (!product.website || !isValidUrl(product.website)) {
    errors.push("Valid website URL is required")
  }

  if (!product.originalPrice || product.originalPrice <= 0) {
    errors.push("Original price must be greater than 0")
  }

  if (!product.date || !isValidDate(product.date)) {
    errors.push("Valid date is required")
  }

  if (!product.userId || product.userId.trim().length === 0) {
    errors.push("User ID is required")
  }

  // Type-specific validation
  if (product.type === "want") {
    const wantProduct = product as WantProduct
    if (wantProduct.currentPrice && wantProduct.currentPrice <= 0) {
      errors.push("Current price must be greater than 0")
    }
    if (wantProduct.targetPrice && wantProduct.targetPrice <= 0) {
      errors.push("Target price must be greater than 0")
    }
  } else if (product.type === "have") {
    const haveProduct = product as HaveProduct
    if (!haveProduct.priceBought || haveProduct.priceBought <= 0) {
      errors.push("Price bought must be greater than 0")
    }
  }

  // Image validation
  if (product.images) {
    product.images.forEach((url, index) => {
      if (!isValidUrl(url)) {
        errors.push(`Image URL ${index + 1} is not a valid URL`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate product updates
 */
export function validateProductUpdate(
  updates: Partial<Omit<Product, "id" | "userId" | "createdAt">>
): ValidationResult {
  const errors: string[] = []

  // Validate name if provided
  if (updates.name !== undefined) {
    if (!updates.name || updates.name.trim().length === 0) {
      errors.push("Product name cannot be empty")
    }
  }

  // Validate website if provided
  if (updates.website !== undefined) {
    if (!isValidUrl(updates.website)) {
      errors.push("Website must be a valid URL")
    }
  }

  // Validate prices if provided
  if (updates.originalPrice !== undefined && updates.originalPrice <= 0) {
    errors.push("Original price must be greater than 0")
  }

  if ("currentPrice" in updates && updates.currentPrice !== undefined && updates.currentPrice !== null) {
    const currentPrice = updates.currentPrice as number
    if (typeof currentPrice === "number" && currentPrice <= 0) {
      errors.push("Current price must be greater than 0")
    }
  }

  if ("priceBought" in updates && updates.priceBought !== undefined) {
    const priceBought = updates.priceBought as number
    if (typeof priceBought === "number" && priceBought <= 0) {
      errors.push("Price bought must be greater than 0")
    }
  }

  // Validate date if provided
  if (updates.date !== undefined && !isValidDate(updates.date)) {
    errors.push("Date must be a valid date")
  }

  // Validate images if provided
  if (updates.images !== undefined) {
    updates.images.forEach((url, index) => {
      if (!isValidUrl(url)) {
        errors.push(`Image URL ${index + 1} is not a valid URL`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Helper: Check if string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Helper: Check if string is a valid date
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

