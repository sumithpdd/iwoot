export type ProductType = "want" | "have"

/** Resale / listing lifecycle for “I have” items */
export type ListingStatus = "not_listed" | "selling" | "sold"

/** One product photo; legacy docs may still store plain URL strings in `images`. */
export interface ProductImageEntry {
  url: string
  tags?: string[]
}

export interface BaseProduct {
  id?: string
  name: string
  brand: string
  /** Optional link to a `brands` profile (same pattern as `storeId` for stores) */
  brandId?: string | null
  website: string
  originalPrice: number
  /** Purchase or listing date (from the form) */
  date: string // ISO date string
  userId: string
  createdAt?: string
  updatedAt?: string
  /** Set by API from signed-in user when the row is created */
  createdByEmail?: string
  /** Set by API from signed-in user on each update */
  updatedByEmail?: string
  // Extended attributes
  /** Rich text (HTML); sanitized when rendered */
  description?: string
  category?: string
  /** Image URLs with optional per-image tags (legacy: array of URL strings). */
  images?: ProductImageEntry[]

  specifications?: Record<string, string> // Key-value pairs for specs
  model?: string
  sku?: string
  color?: string
  size?: string
  condition?: string
  notes?: string
}

export interface WantProduct extends BaseProduct {
  type: "want"
  currentPrice?: number
  priceHistory?: PriceHistory[]
  targetPrice?: number // Desired price to buy at
}

export interface HaveProduct extends BaseProduct {
  type: "have"
  priceBought: number
  priceHistory?: PriceHistory[]
  /** Saved store profile (see /api/stores); `null` on PATCH clears */
  storeId?: string | null
  purchaseLocation?: string
  warrantyExpiry?: string
  receiptId?: string // Link to receipt if purchased with receipt
  /** Where the item is or was listed (marketplaces, classifieds, etc.) */
  listingPlatforms?: string[]
  /** not_listed → selling → sold */
  listingStatus?: ListingStatus
  /** ISO date string when the item sold */
  soldAt?: string
  /** Free text: platform or buyer channel when sold */
  soldWhere?: string
  /** @deprecated Old UI — prefer `listingStatus` + `listingPlatforms` */
  isSelling?: boolean
  /** @deprecated Old UI — prefer `listingPlatforms` */
  sellingOn?: string
}

export interface PriceHistory {
  price: number
  date: string
  website: string
  notes?: string
}

export type Product = WantProduct | HaveProduct

export interface User {
  id: string
  email: string
  displayName?: string
  role: "user" | "admin"
  createdAt: string
}

