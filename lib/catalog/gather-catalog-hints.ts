import type { ProductCatalogHints } from "@/lib/catalog/product-catalog-types"
import { upcItemdbLookup } from "@/lib/catalog/upc-itemdb"
import { openFoodFactsByBarcode } from "@/lib/catalog/open-food-facts"

function str(v: unknown): string {
  if (v === undefined || v === null) return ""
  return String(v).trim()
}

function fingerprint(h: ProductCatalogHints): string {
  return `${h.source}|${h.name ?? ""}|${h.website ?? ""}|${h.description ?? ""}`.slice(0, 400)
}

function pushUnique(
  list: ProductCatalogHints[],
  seen: Set<string>,
  h: ProductCatalogHints | null
) {
  if (!h) return
  const key = fingerprint(h)
  if (seen.has(key)) return
  seen.add(key)
  list.push(h)
}

/**
 * UPCitemdb + Open Food Facts (barcode) — used server-side for AI enrichment.
 */
export async function gatherCatalogHints(current: Record<string, unknown>): Promise<{
  hints: ProductCatalogHints[]
  summaryForPrompt: string
}> {
  const name = str(current.name)
  const brand = str(current.brand)
  const model = str(current.model)
  const sku = str(current.sku)

  const hints: ProductCatalogHints[] = []
  const seen = new Set<string>()

  const barcode = /^\d{8,14}$/.test(sku) ? sku : null

  if (barcode) {
    pushUnique(hints, seen, await upcItemdbLookup(barcode))
    pushUnique(hints, seen, await openFoodFactsByBarcode(barcode))
  }

  const searchQuery = [brand, name, model].filter(Boolean).join(" ").trim()
  if (searchQuery.length >= 2) {
    pushUnique(hints, seen, await upcItemdbLookup(searchQuery))
  }

  if (hints.length === 0) {
    return {
      hints: [],
      summaryForPrompt:
        "No external catalogue hits. If the product has a UPC/EAN, enter it in SKU for automatic catalogue lookup. Otherwise rely on the user's instruction and known form fields.",
    }
  }

  const summaryForPrompt = hints
    .map((h, i) => `Catalog result ${i + 1}: ${JSON.stringify(h)}`)
    .join("\n")

  return { hints, summaryForPrompt }
}
