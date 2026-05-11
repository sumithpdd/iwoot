import { Product } from "@/lib/types/product"

export type ProductSortOption =
  | "purchase-desc"
  | "purchase-asc"
  | "created-desc"
  | "created-asc"
  | "updated-desc"
  | "updated-asc"
  | "name-asc"
  | "name-desc"
  | "price-desc"
  | "price-asc"

export type ProductPriceBand =
  | "all"
  | "under50"
  | "50to200"
  | "over200"
  | "hasHistory"
  | "noHistory"

export function productTimestampMs(
  p: Product,
  field: "purchase" | "created" | "updated"
): number {
  let raw: string | undefined
  if (field === "purchase") raw = p.date
  else if (field === "created") raw = p.createdAt || p.date
  else raw = p.updatedAt || p.createdAt || p.date
  const t = raw ? new Date(raw).getTime() : NaN
  return Number.isFinite(t) ? t : 0
}

export function filterProductsByPriceBand(
  products: Product[],
  band: ProductPriceBand
): Product[] {
  if (band === "all") return products
  return products.filter((p) => {
    const price = p.originalPrice
    const historyLen = p.priceHistory?.length ?? 0
    switch (band) {
      case "under50":
        return price < 50
      case "50to200":
        return price >= 50 && price <= 200
      case "over200":
        return price > 200
      case "hasHistory":
        return historyLen > 0
      case "noHistory":
        return historyLen === 0
      default:
        return true
    }
  })
}

export function sortProducts(
  products: Product[],
  sort: ProductSortOption
): Product[] {
  const list = [...products]
  list.sort((a, b) => {
    switch (sort) {
      case "purchase-desc":
        return productTimestampMs(b, "purchase") - productTimestampMs(a, "purchase")
      case "purchase-asc":
        return productTimestampMs(a, "purchase") - productTimestampMs(b, "purchase")
      case "created-desc":
        return productTimestampMs(b, "created") - productTimestampMs(a, "created")
      case "created-asc":
        return productTimestampMs(a, "created") - productTimestampMs(b, "created")
      case "updated-desc":
        return productTimestampMs(b, "updated") - productTimestampMs(a, "updated")
      case "updated-asc":
        return productTimestampMs(a, "updated") - productTimestampMs(b, "updated")
      case "name-asc":
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      case "name-desc":
        return b.name.localeCompare(a.name, undefined, { sensitivity: "base" })
      case "price-desc":
        return b.originalPrice - a.originalPrice
      case "price-asc":
        return a.originalPrice - b.originalPrice
      default:
        return 0
    }
  })
  return list
}
