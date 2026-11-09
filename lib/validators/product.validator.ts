/**
 * Product Validation Utilities
 * 
 * Centralized validation logic for products.
 * Uses Zod-like validation patterns for consistency.
 */

import { Product, WantProduct, HaveProduct } from "@/lib/types/product"
import { normalizeProductImages } from "@/lib/utils/product-images"
import { isAbsoluteUrl, isCatalogOrHttpAsset } from "@/lib/utils/http-url"
import type { ValidationResult } from "@/lib/validators/result"
import type {
  BuyingStage,
  HaveDisposition,
} from "@/lib/types/want-research"

export type { ValidationResult }

const BUYING_STAGES = new Set<BuyingStage>([
  "researching",
  "shortlisted",
  "ready_to_buy",
  "ordered",
  "bought",
  "cancelled",
])

const HAVE_DISPOSITIONS = new Set<HaveDisposition>([
  "kept",
  "selling",
  "sold",
  "gifted",
  "recycled",
])

const RESEARCH_VISIT_KINDS = new Set([
  "visited_store",
  "checked_online",
  "tried_on",
  "spoke_to_staff",
  "other",
])

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
    validateWantResearchFields(wantProduct, errors)
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
    validateHaveDisposition(haveProduct.disposition, errors)
    validateSharedResearchArrays(haveProduct, errors)
  }

  // Image validation (supports legacy string[] and { url, tags }[])
  const imageEntries = normalizeProductImages(
    (product as { images?: unknown }).images
  )
  imageEntries.forEach((entry, index) => {
    if (!isValidImageSrc(entry.url)) {
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
      if (!isValidImageSrc(entry.url)) {
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

  if ("disposition" in updates) {
    validateHaveDisposition(
      (updates as Partial<HaveProduct>).disposition,
      errors
    )
  }

  if (
    "buyingStage" in updates ||
    "wantBasketId" in updates ||
    "researchSummary" in updates ||
    "researchVisits" in updates ||
    "priceBenchmarks" in updates ||
    "researchLinks" in updates ||
    "buyingPlanSteps" in updates
  ) {
    validateWantResearchFields(updates as Partial<WantProduct>, errors)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

const LISTING_STATUSES = new Set(["not_listed", "selling", "sold"])
const MAX_RESEARCH_SUMMARY = 50_000
const MAX_RESEARCH_LIST = 100

function validateHaveDisposition(
  disposition: unknown,
  errors: string[]
) {
  if (disposition === undefined || disposition === null) return
  if (
    typeof disposition !== "string" ||
    !HAVE_DISPOSITIONS.has(disposition as HaveDisposition)
  ) {
    errors.push(
      "disposition must be kept, selling, sold, gifted, or recycled"
    )
  }
}

function validateWantResearchFields(
  payload: Partial<WantProduct>,
  errors: string[]
) {
  if (payload.buyingStage !== undefined && payload.buyingStage !== null) {
    if (
      typeof payload.buyingStage !== "string" ||
      !BUYING_STAGES.has(payload.buyingStage)
    ) {
      errors.push(
        "buyingStage must be researching, shortlisted, ready_to_buy, ordered, bought, or cancelled"
      )
    }
  }
  if (payload.wantBasketId !== undefined && payload.wantBasketId !== null) {
    if (
      typeof payload.wantBasketId !== "string" ||
      payload.wantBasketId.trim().length === 0
    ) {
      errors.push("wantBasketId must be a non-empty string or null")
    } else if (payload.wantBasketId.length > 128) {
      errors.push("wantBasketId is too long (max 128 characters)")
    }
  }
  validateSharedResearchArrays(payload, errors)
}

function validateSharedResearchArrays(
  payload: {
    researchSummary?: unknown
    researchVisits?: unknown
    priceBenchmarks?: unknown
    researchLinks?: unknown
    buyingPlanSteps?: unknown
  },
  errors: string[]
) {
  if (payload.researchSummary !== undefined && payload.researchSummary !== null) {
    if (typeof payload.researchSummary !== "string") {
      errors.push("researchSummary must be a string")
    } else if (payload.researchSummary.length > MAX_RESEARCH_SUMMARY) {
      errors.push(
        `researchSummary is too long (max ${MAX_RESEARCH_SUMMARY} characters)`
      )
    }
  }

  if (payload.researchVisits !== undefined && payload.researchVisits !== null) {
    if (!Array.isArray(payload.researchVisits)) {
      errors.push("researchVisits must be an array")
    } else if (payload.researchVisits.length > MAX_RESEARCH_LIST) {
      errors.push(`Too many researchVisits (max ${MAX_RESEARCH_LIST})`)
    } else {
      payload.researchVisits.forEach((v, i) => {
        if (!v || typeof v !== "object") {
          errors.push(`researchVisits[${i}] must be an object`)
          return
        }
        const row = v as Record<string, unknown>
        if (typeof row.place !== "string" || !row.place.trim()) {
          errors.push(`researchVisits[${i}].place is required`)
        }
        if (
          typeof row.kind !== "string" ||
          !RESEARCH_VISIT_KINDS.has(row.kind)
        ) {
          errors.push(`researchVisits[${i}].kind is invalid`)
        }
        if (typeof row.checkedAt === "string" && row.checkedAt.trim()) {
          if (!isValidDate(row.checkedAt)) {
            errors.push(`researchVisits[${i}].checkedAt must be a valid date`)
          }
        }
        if (
          row.url !== undefined &&
          row.url !== null &&
          row.url !== "" &&
          (typeof row.url !== "string" || !isAbsoluteUrl(row.url))
        ) {
          errors.push(`researchVisits[${i}].url must be a valid URL`)
        }
      })
    }
  }

  if (
    payload.priceBenchmarks !== undefined &&
    payload.priceBenchmarks !== null
  ) {
    if (!Array.isArray(payload.priceBenchmarks)) {
      errors.push("priceBenchmarks must be an array")
    } else if (payload.priceBenchmarks.length > MAX_RESEARCH_LIST) {
      errors.push(`Too many priceBenchmarks (max ${MAX_RESEARCH_LIST})`)
    } else {
      payload.priceBenchmarks.forEach((b, i) => {
        if (!b || typeof b !== "object") {
          errors.push(`priceBenchmarks[${i}] must be an object`)
          return
        }
        const row = b as Record<string, unknown>
        if (typeof row.itemLabel !== "string" || !row.itemLabel.trim()) {
          errors.push(`priceBenchmarks[${i}].itemLabel is required`)
        }
        if (typeof row.venue !== "string" || !row.venue.trim()) {
          errors.push(`priceBenchmarks[${i}].venue is required`)
        }
        if (
          row.url !== undefined &&
          row.url !== null &&
          row.url !== "" &&
          (typeof row.url !== "string" || !isAbsoluteUrl(row.url))
        ) {
          errors.push(`priceBenchmarks[${i}].url must be a valid URL`)
        }
      })
    }
  }

  if (payload.researchLinks !== undefined && payload.researchLinks !== null) {
    if (!Array.isArray(payload.researchLinks)) {
      errors.push("researchLinks must be an array")
    } else if (payload.researchLinks.length > MAX_RESEARCH_LIST) {
      errors.push(`Too many researchLinks (max ${MAX_RESEARCH_LIST})`)
    } else {
      payload.researchLinks.forEach((l, i) => {
        if (!l || typeof l !== "object") {
          errors.push(`researchLinks[${i}] must be an object`)
          return
        }
        const row = l as Record<string, unknown>
        if (typeof row.label !== "string" || !row.label.trim()) {
          errors.push(`researchLinks[${i}].label is required`)
        }
        if (typeof row.url !== "string" || !isAbsoluteUrl(row.url)) {
          errors.push(`researchLinks[${i}].url must be a valid URL`)
        }
      })
    }
  }

  if (
    payload.buyingPlanSteps !== undefined &&
    payload.buyingPlanSteps !== null
  ) {
    if (!Array.isArray(payload.buyingPlanSteps)) {
      errors.push("buyingPlanSteps must be an array")
    } else if (payload.buyingPlanSteps.length > MAX_RESEARCH_LIST) {
      errors.push(`Too many buyingPlanSteps (max ${MAX_RESEARCH_LIST})`)
    } else {
      payload.buyingPlanSteps.forEach((s, i) => {
        if (!s || typeof s !== "object") {
          errors.push(`buyingPlanSteps[${i}] must be an object`)
          return
        }
        const row = s as Record<string, unknown>
        if (typeof row.title !== "string" || !row.title.trim()) {
          errors.push(`buyingPlanSteps[${i}].title is required`)
        }
      })
    }
  }
}

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
  return isAbsoluteUrl(url)
}

function isValidImageSrc(src: string): boolean {
  return isCatalogOrHttpAsset(src)
}

/**
 * Helper: Check if string is a valid date
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

