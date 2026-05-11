/**
 * Product Validation Utilities
 * 
 * Centralized validation logic for products.
 * Uses Zod-like validation patterns for consistency.
 */

import { Product, WantProduct, HaveProduct } from "@/lib/types/product"
import { normalizeProductImages } from "@/lib/utils/product-images"

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
    validateListingFields(
      {
        listingStatus: haveProduct.listingStatus,
        listingPlatforms: haveProduct.listingPlatforms,
        soldAt: haveProduct.soldAt,
        soldWhere: haveProduct.soldWhere,
      },
      errors
    )
  }

  // Image validation (supports legacy string[] and { url, tags }[])
  const imageEntries = normalizeProductImages(
    (product as { images?: unknown }).images
  )
  imageEntries.forEach((entry, index) => {
    if (!isValidUrl(entry.url)) {
      errors.push(`Image URL ${index + 1} is not a valid URL`)
    }
    entry.tags?.forEach((tag, ti) => {
      if (tag.length > 50) {
        errors.push(`Image ${index + 1} tag ${ti + 1} is too long (max 50 characters)`)
      }
    })
  })

  validateDescriptionAndSpecs(product as { description?: unknown; specifications?: unknown }, errors)

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
    const imageEntries = normalizeProductImages(updates.images as unknown)
    imageEntries.forEach((entry, index) => {
      if (!isValidUrl(entry.url)) {
        errors.push(`Image URL ${index + 1} is not a valid URL`)
      }
      entry.tags?.forEach((tag, ti) => {
        if (tag.length > 50) {
          errors.push(`Image ${index + 1} tag ${ti + 1} is too long (max 50 characters)`)
        }
      })
    })
  }

  if (updates.description !== undefined || updates.specifications !== undefined) {
    validateDescriptionAndSpecs(
      {
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.specifications !== undefined ? { specifications: updates.specifications } : {}),
      },
      errors
    )
  }

  if (
    "listingStatus" in updates ||
    "listingPlatforms" in updates ||
    "soldAt" in updates ||
    "soldWhere" in updates
  ) {
    const u = updates as Partial<HaveProduct>
    validateListingFields(
      {
        listingStatus: u.listingStatus,
        listingPlatforms: u.listingPlatforms,
        soldAt: u.soldAt,
        soldWhere: u.soldWhere,
      },
      errors
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

const LISTING_STATUSES = new Set(["not_listed", "selling", "sold"])

function validateListingFields(
  payload: {
    listingStatus?: unknown
    listingPlatforms?: unknown
    soldAt?: unknown
    soldWhere?: unknown
  },
  errors: string[]
) {
  if (payload.listingStatus !== undefined && payload.listingStatus !== null) {
    if (
      typeof payload.listingStatus !== "string" ||
      !LISTING_STATUSES.has(payload.listingStatus)
    ) {
      errors.push("listingStatus must be not_listed, selling, or sold")
    }
  }
  if (payload.listingPlatforms !== undefined && payload.listingPlatforms !== null) {
    if (!Array.isArray(payload.listingPlatforms)) {
      errors.push("listingPlatforms must be an array of strings")
    } else if (payload.listingPlatforms.length > 20) {
      errors.push("Too many listing platforms (max 20)")
    } else {
      payload.listingPlatforms.forEach((p, i) => {
        if (typeof p !== "string" || p.trim().length === 0) {
          errors.push(`listingPlatforms[${i}] must be a non-empty string`)
        } else if (p.length > 80) {
          errors.push(`listingPlatforms[${i}] is too long (max 80 characters)`)
        }
      })
    }
  }
  if (
    payload.soldAt !== undefined &&
    payload.soldAt !== null &&
    String(payload.soldAt).trim() !== ""
  ) {
    if (!isValidDate(String(payload.soldAt))) {
      errors.push("soldAt must be a valid date")
    }
  }
  if (
    payload.soldWhere !== undefined &&
    payload.soldWhere !== null &&
    typeof payload.soldWhere === "string" &&
    payload.soldWhere.length > 500
  ) {
    errors.push("soldWhere is too long (max 500 characters)")
  }
}

const MAX_DESCRIPTION_CHARS = 400_000
const MAX_SPEC_ROWS = 80
const MAX_SPEC_KEY_LEN = 120
const MAX_SPEC_VALUE_LEN = 4000

function validateDescriptionAndSpecs(
  payload: { description?: unknown; specifications?: unknown },
  errors: string[]
) {
  if (payload.description !== undefined && payload.description !== null) {
    if (typeof payload.description !== "string") {
      errors.push("Description must be a string")
    } else if (payload.description.length > MAX_DESCRIPTION_CHARS) {
      errors.push(`Description is too long (max ${MAX_DESCRIPTION_CHARS} characters)`)
    }
  }

  if (payload.specifications === undefined || payload.specifications === null) return
  if (typeof payload.specifications !== "object" || Array.isArray(payload.specifications)) {
    errors.push("Specifications must be an object map")
    return
  }
  const entries = Object.entries(payload.specifications as Record<string, string>)
  if (entries.length > MAX_SPEC_ROWS) {
    errors.push(`Too many specification entries (max ${MAX_SPEC_ROWS})`)
  }
  entries.forEach(([k, v], i) => {
    if (k.length > MAX_SPEC_KEY_LEN) {
      errors.push(`Specification ${i + 1} name is too long (max ${MAX_SPEC_KEY_LEN} characters)`)
    }
    if (String(v).length > MAX_SPEC_VALUE_LEN) {
      errors.push(`Specification ${i + 1} value is too long (max ${MAX_SPEC_VALUE_LEN} characters)`)
    }
  })
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

