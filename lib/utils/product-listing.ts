import type { HaveProduct, Product } from "@/lib/types/product"

/** Comma, semicolon, or newline separated */
export function parseListingPlatformsCsv(csv: string | undefined | null): string[] {
  if (!csv || typeof csv !== "string") return []
  const parts = csv.split(/[\n,;]+/)
  const out: string[] = []
  for (const p of parts) {
    const t = p.trim()
    if (t && !out.includes(t)) out.push(t)
  }
  return out.slice(0, 20)
}

export function listingPlatformsToCsv(platforms: string[] | undefined): string {
  if (!platforms?.length) return ""
  return platforms.join(", ")
}

export function getListingStatus(p: Product): "not_listed" | "selling" | "sold" {
  if (p.type !== "have") return "not_listed"
  const h = p as HaveProduct
  if (h.listingStatus) return h.listingStatus
  if (h.isSelling) return "selling"
  return "not_listed"
}

export function getListingPlatforms(p: Product): string[] {
  if (p.type !== "have") return []
  const h = p as HaveProduct
  if (Array.isArray(h.listingPlatforms) && h.listingPlatforms.length > 0) {
    return h.listingPlatforms.map((x) => String(x).trim()).filter(Boolean)
  }
  if (h.sellingOn?.trim()) {
    return parseListingPlatformsCsv(h.sellingOn)
  }
  return []
}
