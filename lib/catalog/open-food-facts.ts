/**
 * Open Food Facts — open product database (food & many packaged goods).
 * https://openfoodfacts.github.io/openfoodfacts-server/api/
 * No API key; best when barcode is known (EAN-13 / UPC).
 */

import type { ProductCatalogHints } from "@/lib/catalog/product-catalog-types"

export async function openFoodFactsByBarcode(
  barcode: string
): Promise<ProductCatalogHints | null> {
  const code = barcode.replace(/\D/g, "")
  if (code.length < 8 || code.length > 14) return null

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`,
      { headers: { Accept: "application/json" }, next: { revalidate: 0 } }
    )
    if (!res.ok) return null

    const data = (await res.json()) as {
      status?: number
      product?: {
        product_name?: string
        generic_name?: string
        brands?: string
        categories?: string
        quantity?: string
        ingredients_text?: string
        image_url?: string
      }
    }

    if (data.status !== 1 || !data.product) return null

    const p = data.product
    const description = [p.generic_name, p.quantity, p.ingredients_text]
      .filter(Boolean)
      .join(" · ")

    return {
      source: "Open Food Facts",
      name: p.product_name,
      brand: p.brands,
      description: description || undefined,
      category: p.categories,
      images: p.image_url ? [p.image_url] : undefined,
      rawNote: "Open Food Facts is optimised for food; use only if it matches the product.",
    }
  } catch {
    return null
  }
}
