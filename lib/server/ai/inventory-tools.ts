import { tool } from "ai"
import { z } from "zod"
import { listProductsByUser } from "@/lib/server/repositories/products.repository"
import { getProductById } from "@/lib/server/repositories/products.repository"
import {
  getSellComparePageBySlug,
  listSellComparePages,
} from "@/lib/server/repositories/sell-compare.repository"
import {
  LIVE_LISTING_PLATFORMS,
  recordLiveListing,
  updateProductListingStatus,
} from "@/lib/server/resale/record-live-listing"
import type { HaveProduct, Product } from "@/lib/types/product"
import { getListingPlatforms, getListingStatus } from "@/lib/utils/product-listing"
import { htmlToPlainText } from "@/lib/utils/html-plain-text"

function productSummary(p: Product) {
  const base = {
    id: p.id,
    type: p.type,
    name: p.name,
    brand: p.brand,
    model: p.model ?? null,
    sku: p.sku ?? null,
    originalPrice: p.originalPrice,
    date: p.date,
  }
  if (p.type === "have") {
    const h = p as HaveProduct
    return {
      ...base,
      priceBought: h.priceBought,
      listingStatus: getListingStatus(h),
      listingPlatforms: getListingPlatforms(h),
      condition: h.condition ?? null,
      purchaseLocation: h.purchaseLocation ?? null,
    }
  }
  return {
    ...base,
    currentPrice: p.currentPrice ?? null,
    targetPrice: p.targetPrice ?? null,
  }
}

function matchProduct(products: Product[], query: string): Product | undefined {
  const q = query.trim().toLowerCase()
  if (!q) return undefined
  return products.find((p) => {
    const hay = `${p.name} ${p.brand} ${p.model || ""} ${p.sku || ""} ${p.id}`.toLowerCase()
    return hay.includes(q) || q.split(/\s+/).every((t) => hay.includes(t))
  })
}

export function buildInventoryChatTools(uid: string) {
  return {
    list_inventory: tool({
      description:
        "List the signed-in user’s saved want/have products from Firestore. Use before answering ownership or resale questions.",
      inputSchema: z.object({
        type: z.enum(["all", "want", "have"]).default("all"),
      }),
      execute: async ({ type }) => {
        const products = await listProductsByUser(
          uid,
          type === "all" ? undefined : type
        )
        return {
          count: products.length,
          products: products.map(productSummary),
        }
      },
    }),

    get_sell_compare: tool({
      description:
        "Load UK sell-compare venue rows from Firestore (Gumtree, CeX, Shpock, etc.) for a page slug.",
      inputSchema: z.object({
        slug: z
          .string()
          .describe("Sell-compare page slug, e.g. sonos-move"),
      }),
      execute: async ({ slug }) => {
        const entry = await getSellComparePageBySlug(slug)
        if (!entry) return { error: "Unknown slug" }
        return {
          title: entry.title,
          path: entry.path,
          blurb: entry.blurb,
          venues: entry.venues,
        }
      },
    }),

    list_sell_compare_pages: tool({
      description: "List published sell-compare pages from Firestore.",
      inputSchema: z.object({}),
      execute: async () => {
        const pages = await listSellComparePages({ publishedOnly: true })
        return {
          pages: pages.map((e) => ({
            slug: e.slug,
            path: e.path,
            title: e.title,
            blurb: e.blurb,
          })),
        }
      },
    }),

    draft_listing: tool({
      description:
        "Draft a concise Gumtree / Shpock / CeX-oriented listing title and body from a saved have product.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("Product name, brand, model, sku, or Firestore id"),
        platform: z
          .enum(["Gumtree", "Shpock", "CeX (we buy)", "Facebook Marketplace", "eBay"])
          .default("Gumtree"),
      }),
      execute: async ({ query, platform }) => {
        const products = await listProductsByUser(uid, "have")
        const product =
          products.find((p) => p.id === query.trim()) || matchProduct(products, query)
        if (!product || product.type !== "have") {
          return { error: "No matching have product in inventory" }
        }
        const h = product as HaveProduct
        const condition = h.condition || "Good"
        const desc = htmlToPlainText(h.description || "").slice(0, 400)
        const title = `${product.brand} ${product.name}${product.model ? ` (${product.model})` : ""} — ${condition}`
        const body = [
          `${product.brand} ${product.name}${product.model ? `, model ${product.model}` : ""}${product.sku ? `, SKU ${product.sku}` : ""}.`,
          `Condition: ${condition}.`,
          h.purchaseLocation ? `Bought from: ${h.purchaseLocation}.` : null,
          `Paid £${h.priceBought.toFixed(2)} (tracker). Asking price for ${platform} — check sell-compare before posting.`,
          desc || null,
          "Collection or postage as agreed. Happy to demo if local.",
        ]
          .filter(Boolean)
          .join("\n\n")
        return {
          productId: product.id,
          platform,
          title,
          body,
          tip: "Open /sell-compare for venue price ranges before you set an asking price.",
        }
      },
    }),

    get_product: tool({
      description: "Fetch one product by Firestore document id (must belong to the user).",
      inputSchema: z.object({ productId: z.string() }),
      execute: async ({ productId }) => {
        const product = await getProductById(productId)
        if (!product || product.userId !== uid) {
          return { error: "Product not found" }
        }
        return productSummary(product)
      },
    }),

    record_live_listing: tool({
      description:
        "Record that the user posted a live marketplace ad (Gumtree, Shpock, …): mark the have product as selling, save the URL/price in notes, and add a “Your live listing” row on the matching sell-compare page.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("Product name, brand, model, sku, or Firestore id"),
        platform: z.enum(LIVE_LISTING_PLATFORMS),
        url: z.string().url().describe("Live ad URL"),
        priceGbp: z.number().nonnegative().describe("Asking price in GBP"),
        sellCompareSlug: z
          .string()
          .optional()
          .describe(
            "Optional sell-compare slug (e.g. sonos-move). Inferred from product name when omitted."
          ),
        location: z.string().optional().describe("e.g. Isle of Dogs"),
        notes: z.string().optional(),
        setWebsite: z
          .boolean()
          .optional()
          .describe("Set product.website to the ad URL (default true)"),
      }),
      execute: async (args) => recordLiveListing(uid, args),
    }),

    update_listing_status: tool({
      description:
        "Set a have product listingStatus to not_listed, selling, or sold (optional soldWhere / soldAt).",
      inputSchema: z.object({
        query: z.string().describe("Product name or id"),
        listingStatus: z.enum(["not_listed", "selling", "sold"]),
        soldWhere: z.string().optional(),
        soldAt: z.string().optional().describe("ISO date YYYY-MM-DD"),
      }),
      execute: async (args) => updateProductListingStatus(uid, args),
    }),
  }
}
