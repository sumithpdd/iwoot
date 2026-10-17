import {
  getProductById,
  listProductsByUser,
  updateProductDoc,
} from "@/lib/server/repositories/products.repository"
import {
  getSellComparePageBySlug,
  listSellComparePages,
  upsertLiveVenueRow,
} from "@/lib/server/repositories/sell-compare.repository"
import type { HaveProduct, ListingStatus, Product } from "@/lib/types/product"
import type { VenuePriceRow } from "@/lib/types/sell-compare"
import { getListingPlatforms } from "@/lib/utils/product-listing"
import { isAbsoluteUrl } from "@/lib/utils/http-url"

export const LIVE_LISTING_PLATFORMS = [
  "Gumtree",
  "Shpock",
  "CeX (we buy)",
  "Facebook Marketplace",
  "eBay",
] as const

export type LiveListingPlatform = (typeof LIVE_LISTING_PLATFORMS)[number]

function matchProduct(products: Product[], query: string): Product | undefined {
  const q = query.trim().toLowerCase()
  if (!q) return undefined
  return (
    products.find((p) => p.id === query.trim()) ||
    products.find((p) => {
      const hay =
        `${p.name} ${p.brand} ${p.model || ""} ${p.sku || ""}`.toLowerCase()
      return hay.includes(q) || q.split(/\s+/).every((t) => hay.includes(t))
    })
  )
}

function platformVenueId(platform: LiveListingPlatform): string {
  const key = platform.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return `${key}-live-own`
}

/** Guess sell-compare slug from product name when the caller does not pass one. */
export function guessSellCompareSlug(product: Product): string | null {
  const hay = `${product.name} ${product.brand} ${product.model || ""}`.toLowerCase()
  if (hay.includes("nebula") || hay.includes("cosmos max")) return "nebula-cosmos-max"
  if (hay.includes("move 2") || hay.includes("move2")) return "sonos-move-2"
  if (hay.includes("sonos") && hay.includes("move")) return "sonos-move"
  if (hay.includes("airpods")) return "airpods-pro-2"
  return null
}

export type RecordLiveListingInput = {
  query: string
  platform: LiveListingPlatform
  url: string
  priceGbp: number
  sellCompareSlug?: string
  location?: string
  notes?: string
  /** Default true — set product.website to the listing URL */
  setWebsite?: boolean
}

export type RecordLiveListingResult =
  | {
      ok: true
      productId: string
      productName: string
      platform: LiveListingPlatform
      priceGbp: number
      url: string
      listingPlatforms: string[]
      sellCompareSlug: string | null
      venueId: string | null
    }
  | { ok: false; error: string }

export async function recordLiveListing(
  uid: string,
  input: RecordLiveListingInput
): Promise<RecordLiveListingResult> {
  const url = input.url.trim()
  if (!isAbsoluteUrl(url) || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    return { ok: false, error: "url must be an http(s) absolute URL" }
  }
  if (!Number.isFinite(input.priceGbp) || input.priceGbp < 0) {
    return { ok: false, error: "priceGbp must be a non-negative number" }
  }

  const products = await listProductsByUser(uid, "have")
  const product = matchProduct(products, input.query)
  if (!product || product.type !== "have") {
    return { ok: false, error: "No matching have product in inventory" }
  }

  const platforms = getListingPlatforms(product as HaveProduct)
  if (!platforms.some((p) => p.toLowerCase() === input.platform.toLowerCase())) {
    platforms.push(input.platform)
  }

  const today = new Date().toISOString().slice(0, 10)
  const noteLine = [
    `${input.platform} live £${input.priceGbp}: ${url}`,
    input.location ? `(${input.location})` : null,
    `(posted ${today})`,
    input.notes?.trim() || null,
  ]
    .filter(Boolean)
    .join(" ")

  const prevNotes = String((product as HaveProduct).notes || "").trim()
  const notes = prevNotes.includes(url)
    ? prevNotes
    : prevNotes
      ? `${prevNotes}\n${noteLine}`
      : noteLine

  const updates: Record<string, unknown> = {
    listingStatus: "selling" satisfies ListingStatus,
    listingPlatforms: platforms,
    notes,
  }
  if (input.setWebsite !== false) {
    updates.website = url
  }

  await updateProductDoc(product.id!, updates)

  let sellCompareSlug =
    input.sellCompareSlug?.trim() || guessSellCompareSlug(product) || null
  let venueId: string | null = null

  if (sellCompareSlug) {
    const page = await getSellComparePageBySlug(sellCompareSlug)
    if (!page) {
      const pages = await listSellComparePages({ publishedOnly: true })
      const match = pages.find((p) => p.slug === sellCompareSlug)
      if (!match) {
        sellCompareSlug = null
      }
    }
  }

  if (sellCompareSlug) {
    venueId = platformVenueId(input.platform)
    const venue: VenuePriceRow = {
      id: venueId,
      venue: input.platform.startsWith("CeX") ? "CeX (webuy)" : input.platform,
      kind: input.platform.startsWith("CeX") ? "trade_in" : "peer_listing",
      priceGbp: input.priceGbp,
      priceLabel: input.location
        ? `Your live listing (${input.location})`
        : "Your live listing",
      url,
      lastCheckedIso: today,
      notes:
        input.notes?.trim() ||
        `Posted ${today} — recorded via IWOOT MCP / chat.`,
    }
    await upsertLiveVenueRow(sellCompareSlug, venue)
  }

  return {
    ok: true,
    productId: product.id!,
    productName: `${product.brand} ${product.name}`,
    platform: input.platform,
    priceGbp: input.priceGbp,
    url,
    listingPlatforms: platforms,
    sellCompareSlug,
    venueId,
  }
}

export type UpdateListingStatusInput = {
  query: string
  listingStatus: ListingStatus
  soldWhere?: string
  soldAt?: string
}

export async function updateProductListingStatus(
  uid: string,
  input: UpdateListingStatusInput
): Promise<
  | { ok: true; productId: string; listingStatus: ListingStatus }
  | { ok: false; error: string }
> {
  const products = await listProductsByUser(uid, "have")
  const product = matchProduct(products, input.query)
  if (!product || product.type !== "have") {
    return { ok: false, error: "No matching have product in inventory" }
  }

  const updates: Record<string, unknown> = {
    listingStatus: input.listingStatus,
  }
  if (input.listingStatus === "sold") {
    if (input.soldWhere?.trim()) updates.soldWhere = input.soldWhere.trim()
    updates.soldAt = input.soldAt?.trim() || new Date().toISOString().slice(0, 10)
  } else {
    updates.soldWhere = null
    updates.soldAt = null
  }

  await updateProductDoc(product.id!, updates)
  return {
    ok: true,
    productId: product.id!,
    listingStatus: input.listingStatus,
  }
}

/** Resolve product by id with ownership check (for get_product enrichment). */
export async function getOwnedProduct(uid: string, productId: string) {
  const product = await getProductById(productId)
  if (!product || product.userId !== uid) return null
  return product
}
