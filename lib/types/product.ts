export type ProductType = "want" | "have"

export interface BaseProduct {
  id?: string
  name: string
  brand: string
  website: string
  originalPrice: number
  date: string // ISO date string
  userId: string
  createdAt?: string
  updatedAt?: string
  // Extended attributes
  description?: string
  category?: string
  images?: string[] // Array of image URLs
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
  purchaseLocation?: string
  warrantyExpiry?: string
  receiptId?: string // Link to receipt if purchased with receipt
  isSelling?: boolean // Whether the product is currently being sold
  sellingOn?: string // Platform where it's being sold (e.g., "Gumtree", "eBay", "Facebook Marketplace")
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

