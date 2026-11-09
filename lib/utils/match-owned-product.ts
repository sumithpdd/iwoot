import type { Product } from "@/lib/types/product"

/** Match by exact id or fuzzy name/brand/model/sku (for chat / MCP tools). */
export function matchOwnedProduct(
  products: Product[],
  query: string
): Product | undefined {
  const q = query.trim().toLowerCase()
  if (!q) return undefined
  const exact = products.find((p) => p.id === query.trim())
  if (exact) return exact
  return products.find((p) => {
    const hay =
      `${p.name} ${p.brand} ${p.model || ""} ${p.sku || ""} ${p.id}`.toLowerCase()
    return hay.includes(q) || q.split(/\s+/).every((t) => hay.includes(t))
  })
}
