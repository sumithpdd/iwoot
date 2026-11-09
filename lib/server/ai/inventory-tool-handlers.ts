/**
 * Shared execute handlers for Gemini chat tools and MCP.
 * Keep business logic here (or in lib/server/resale/*); wrappers only adapt SDKs.
 */

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
  type LiveListingPlatform,
  type RecordLiveListingInput,
} from "@/lib/server/resale/record-live-listing"
import {
  addPriceBenchmark,
  addResearchLink,
  addResearchVisit,
  appendProductNotes,
  convertWantToHave,
  getWantDetails,
  listWantResearchContext,
  setBuyingPlanSteps,
  updateBuyingStage,
  updateHaveDisposition,
  upsertWantBasket,
  upsertWantProduct,
} from "@/lib/server/resale/want-research"
import type { HaveProduct, ListingStatus, Product, WantProduct } from "@/lib/types/product"
import type { BuyingStage, HaveDisposition } from "@/lib/types/want-research"
import { getListingPlatforms, getListingStatus } from "@/lib/utils/product-listing"
import { htmlToPlainText } from "@/lib/utils/html-plain-text"
import { matchOwnedProduct } from "@/lib/utils/match-owned-product"

export { LIVE_LISTING_PLATFORMS }

export function summarizeProduct(p: Product) {
  const base = {
    id: p.id,
    type: p.type,
    name: p.name,
    brand: p.brand,
    model: p.model ?? null,
    sku: p.sku ?? null,
    originalPrice: p.originalPrice,
    date: p.date,
    website: p.website,
    notes: p.notes ?? null,
  }
  if (p.type === "have") {
    const h = p as HaveProduct
    return {
      ...base,
      priceBought: h.priceBought,
      listingStatus: getListingStatus(h),
      listingPlatforms: getListingPlatforms(h),
      disposition: h.disposition ?? null,
      condition: h.condition ?? null,
      purchaseLocation: h.purchaseLocation ?? null,
      researchVisitCount: h.researchVisits?.length ?? 0,
    }
  }
  const w = p as WantProduct
  return {
    ...base,
    currentPrice: w.currentPrice ?? null,
    targetPrice: w.targetPrice ?? null,
    buyingStage: w.buyingStage ?? null,
    wantBasketId: w.wantBasketId ?? null,
    researchVisitCount: w.researchVisits?.length ?? 0,
    priceBenchmarkCount: w.priceBenchmarks?.length ?? 0,
    researchLinkCount: w.researchLinks?.length ?? 0,
  }
}

export function createInventoryToolHandlers(uid: string) {
  return {
    list_inventory: async (args: { type?: "all" | "want" | "have" }) => {
      const type = args.type ?? "all"
      const products = await listProductsByUser(
        uid,
        type === "all" ? undefined : type
      )
      return {
        count: products.length,
        products: products.map(summarizeProduct),
      }
    },

    get_product: async (args: { productId: string }) => {
      const product = await getProductById(args.productId)
      if (!product || product.userId !== uid) {
        return { error: "Product not found" }
      }
      return summarizeProduct(product)
    },

    list_sell_compare_pages: async () => {
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

    get_sell_compare: async (args: { slug: string }) => {
      const entry = await getSellComparePageBySlug(args.slug)
      if (!entry) return { error: "Unknown slug" }
      return {
        title: entry.title,
        path: entry.path,
        blurb: entry.blurb,
        venues: entry.venues,
      }
    },

    draft_listing: async (args: {
      query: string
      platform?: LiveListingPlatform
    }) => {
      const platform = args.platform ?? "Gumtree"
      const products = await listProductsByUser(uid, "have")
      const product =
        products.find((p) => p.id === args.query.trim()) ||
        matchOwnedProduct(products, args.query)
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

    record_live_listing: (args: RecordLiveListingInput) =>
      recordLiveListing(uid, args),

    update_listing_status: (args: {
      query: string
      listingStatus: ListingStatus
      soldWhere?: string
      soldAt?: string
    }) => updateProductListingStatus(uid, args),

    list_want_research: () => listWantResearchContext(uid),

    get_want_details: (args: { query: string }) => getWantDetails(uid, args.query),

    upsert_want_basket: (
      args: Parameters<typeof upsertWantBasket>[1]
    ) => upsertWantBasket(uid, args),

    upsert_want_product: (
      args: Parameters<typeof upsertWantProduct>[1]
    ) => upsertWantProduct(uid, args),

    add_research_visit: (
      args: Parameters<typeof addResearchVisit>[1]
    ) => addResearchVisit(uid, args),

    add_price_benchmark: (
      args: Parameters<typeof addPriceBenchmark>[1]
    ) => addPriceBenchmark(uid, args),

    add_research_link: (
      args: Parameters<typeof addResearchLink>[1]
    ) => addResearchLink(uid, args),

    set_buying_plan_steps: (
      args: Parameters<typeof setBuyingPlanSteps>[1]
    ) => setBuyingPlanSteps(uid, args),

    update_buying_stage: (args: {
      query: string
      target?: "product" | "basket"
      buyingStage: BuyingStage
    }) => updateBuyingStage(uid, args),

    convert_want_to_have: (
      args: Parameters<typeof convertWantToHave>[1]
    ) => convertWantToHave(uid, args),

    update_have_disposition: (args: {
      query: string
      disposition: HaveDisposition
      soldWhere?: string
      soldAt?: string
    }) => updateHaveDisposition(uid, args),

    append_product_notes: (
      args: Parameters<typeof appendProductNotes>[1]
    ) => appendProductNotes(uid, args),
  }
}

export type InventoryToolHandlers = ReturnType<typeof createInventoryToolHandlers>
