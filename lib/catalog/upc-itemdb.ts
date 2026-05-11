/**
 * UPCitemdb trial API — free, no API key (rate limits apply).
 * https://www.upcitemdb.com/wp/docs/main/development/
 */

import type { ProductCatalogHints } from "@/lib/catalog/product-catalog-types"

function itemToHints(item: Record<string, unknown>, source: string): ProductCatalogHints {
  const images = item.images as string[] | undefined
  const offers = item.offers as { link?: string }[] | undefined
  return {
    source,
    name: (item.title as string) || (item.description as string),
    brand: item.brand as string | undefined,
    description: item.description as string | undefined,
    category: item.category as string | undefined,
    images: images?.length ? images : undefined,
    price:
      (item.lowest_recorded_price as number) ||
      (item.highest_recorded_price as number) ||
      undefined,
    website: offers?.[0]?.link,
    specifications: (item.specs as Record<string, string>) || undefined,
  }
}

async function lookupByBarcode(barcode: string): Promise<ProductCatalogHints | null> {
  try {
    const response = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        next: { revalidate: 0 },
      }
    )

    if (!response.ok) return null

    const data = (await response.json()) as {
      code?: string
      items?: Record<string, unknown>[]
    }

    if (data.code === "OK" && data.items?.length) {
      return itemToHints(data.items[0], "UPCitemdb (barcode)")
    }
    return null
  } catch {
    return null
  }
}

async function searchByName(productName: string): Promise<ProductCatalogHints | null> {
  try {
    const response = await fetch(
      `https://api.upcitemdb.com/prod/trial/search?s=${encodeURIComponent(productName)}&match_mode=0&type=product`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        next: { revalidate: 0 },
      }
    )

    if (!response.ok) return null

    const data = (await response.json()) as {
      code?: string
      items?: Record<string, unknown>[]
    }

    if (data.code === "OK" && data.items?.length) {
      return itemToHints(data.items[0], "UPCitemdb (name search)")
    }
    return null
  } catch {
    return null
  }
}

/**
 * Numeric query → barcode lookup; otherwise → name search.
 */
export async function upcItemdbLookup(query: string): Promise<ProductCatalogHints | null> {
  const q = query.trim()
  if (!q) return null
  if (/^\d+$/.test(q)) {
    const hit = await lookupByBarcode(q)
    if (hit) return hit
  }
  return searchByName(q)
}
