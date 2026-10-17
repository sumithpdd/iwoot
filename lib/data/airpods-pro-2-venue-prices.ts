/**
 * Reference prices for comparing where to sell AirPods Pro 2 (UK).
 * Most marketplaces render prices in the browser; update this file when you check each site.
 *
 * - Peer listings (Gumtree, Shpock): one seller’s asking price, not a guaranteed sale.
 * - CeX: typically shows cash vs voucher when you open the product page.
 * - Backmarket: use their sell/refurb flow for a quote (condition-dependent).
 */

import type { VenuePriceRow } from "@/lib/data/venue-price-types"

export type { VenuePriceKind, VenuePriceRow } from "@/lib/data/venue-price-types"

export const AIRPODS_PRO_2_PRODUCT_TITLE =
  'Apple AirPods Pro 2 (2nd gen, USB‑C / MagSafe case — check exact SKU on each site)'

export const AIRPODS_PRO_2_VENUE_ROWS: VenuePriceRow[] = [
  {
    id: "backmarket",
    venue: "Back Market",
    kind: "platform_buyback",
    priceGbp: null,
    priceLabel: "Instant quote (sell flow)",
    url: "https://www.backmarket.co.uk/en-gb/p/airpods-pro-2-2022-with-charging-case-magsafe-white/9d3806a1-ff82-4818-bdd0-b295a4929e1e?l=10",
    lastCheckedIso: "2026-05-11",
    notes: "Price depends on condition; use the site’s sell / trade-in flow.",
  },
  {
    id: "cex",
    venue: "CeX (webuy)",
    kind: "trade_in",
    priceGbp: null,
    priceLabel: "Cash / voucher (grade-based)",
    url: "https://uk.webuy.com/product-detail?id=195949052637B&categoryName=APPLE-AIRPODS-EARPODS-HEADPHONES&superCatName=ELECTRONICS&title=&queryID=9F2802F13EA96EC8C448CB8DE8A56567&position=1",
    lastCheckedIso: "2026-05-11",
    notes: "Product page is heavily client-rendered; open the link to see today’s buy prices.",
  },
  {
    id: "gumtree",
    venue: "Gumtree",
    kind: "peer_listing",
    priceGbp: 80,
    priceLabel: "Asking price (example listing)",
    url: "https://www.gumtree.com/p/headphones/apple-airpods-pro-2/1513370228",
    lastCheckedIso: "2026-05-11",
    notes: "Single private ad in Luton; other listings will differ.",
  },
  {
    id: "shpock",
    venue: "Shpock",
    kind: "peer_listing",
    priceGbp: null,
    priceLabel: "Asking price (listing)",
    url: "https://www.shpock.com/en-gb/i/acA81yCuAk-IDpZ3/airpods-pro-2-2nd-gen",
    lastCheckedIso: "2026-05-11",
    notes: "Verify the live listing; automated fetch may not match in-app content.",
  },
]
