import type { HaveProduct } from "@/lib/types/product"
import { AIRPODS_PRO_2_REFERENCE } from "@/lib/data/airpods-pro-2-product-reference"

const DEFAULT_WEBSITE = "https://www.apple.com/uk/airpods-pro/"

/**
 * Payload for `POST /api/products` — AirPods Pro 2 demo “I have” row (UK-oriented).
 */
export function buildAirpodsPro2SeedHave(args: {
  userId: string
  brandId: string | null
  /** When true, prefill listing platforms aligned with sell-compare venues */
  withListingPlatforms: boolean
}): Omit<HaveProduct, "id" | "createdAt" | "updatedAt"> {
  const today = new Date().toISOString().split("T")[0]
  const specs = { ...AIRPODS_PRO_2_REFERENCE.typicalSpecifications }
  const listingPlatforms = args.withListingPlatforms
    ? ["Back Market", "CeX (we buy)", "Gumtree", "Shpock"]
    : []

  return {
    type: "have",
    userId: args.userId,
    name: AIRPODS_PRO_2_REFERENCE.title,
    brand: "Apple",
    ...(args.brandId ? { brandId: args.brandId } : {}),
    website: DEFAULT_WEBSITE,
    originalPrice: 229,
    priceBought: 199.99,
    date: today,
    description: `<p>${AIRPODS_PRO_2_REFERENCE.summary}</p><p>${AIRPODS_PRO_2_REFERENCE.peerListingNote}</p>`,
    category: "Headphones",
    model: "AirPods Pro (2nd generation)",
    sku: "MTJV3 (example — verify your case/charger variant)",
    listingStatus: args.withListingPlatforms ? "selling" : "not_listed",
    listingPlatforms,
    specifications: specs,
    notes: "Seeded demo product. Edit or delete anytime. Compare venues under Sell compare → AirPods Pro 2.",
  }
}
