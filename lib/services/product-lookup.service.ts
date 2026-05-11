/**
 * Product Lookup Service — client-side auto-fill from public catalog APIs.
 *
 * - **UPCitemdb** (trial): barcode + name search, no API key.
 * - Server-side AI assist also uses `lib/catalog/gather-catalog-hints.ts` (same UPCitemdb + Open Food Facts).
 */

import { upcItemdbLookup } from "@/lib/catalog/upc-itemdb"
import type { ProductCatalogHints } from "@/lib/catalog/product-catalog-types"

export interface ProductLookupResult {
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
}

function mapHints(h: ProductCatalogHints): ProductLookupResult {
  return {
    name: h.name,
    brand: h.brand,
    description: h.description,
    category: h.category,
    model: h.model,
    sku: h.sku,
    images: h.images,
    price: h.price,
    website: h.website,
    specifications: h.specifications,
  }
}

export async function lookupProduct(
  query: string
): Promise<ProductLookupResult | null> {
  if (!query || query.trim().length === 0) {
    return null
  }
  const h = await upcItemdbLookup(query.trim())
  return h ? mapHints(h) : null
}

export async function lookupProductByUrl(url: string): Promise<ProductLookupResult | null> {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    const pathParts = urlObj.pathname.split("/").filter(Boolean)
    const lastPart = pathParts[pathParts.length - 1]

    if (hostname.includes("amazon")) {
      const asinMatch =
        url.match(/\/dp\/([A-Z0-9]{10})/i) ||
        url.match(/\/gp\/product\/([A-Z0-9]{10})/i)
      if (asinMatch && asinMatch[1]) {
        return {
          name: lastPart.replace(/-/g, " "),
          website: url,
        }
      }
    }

    return {
      name: lastPart.replace(/-/g, " ").replace(/\.html?$/i, ""),
      website: url,
    }
  } catch (error) {
    console.error("[Product Lookup] Error parsing URL:", error)
    return null
  }
}
