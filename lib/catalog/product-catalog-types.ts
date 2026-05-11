/** Normalized row from public product catalog APIs (UPCitemdb, Open Food Facts, etc.) */
export interface ProductCatalogHints {
  source: string
  name?: string
  brand?: string
  description?: string
  category?: string
  model?: string
  sku?: string
  images?: string[]
  price?: number
  website?: string
  specifications?: Record<string, string>
  rawNote?: string
}
