/**
 * Reference prices for selling Nebula Cosmos Max 4K (D2150) — UK.
 * Update when you re-check each marketplace.
 */

import type { VenuePriceRow } from "@/lib/data/venue-price-types"

export type { VenuePriceKind, VenuePriceRow } from "@/lib/data/venue-price-types"

export const NEBULA_COSMOS_MAX_PRODUCT_TITLE =
  "Nebula Cosmos Max 4K (D2150 — portable home cinema projector)"

export const NEBULA_COSMOS_MAX_COMPARE_PATH = "/sell-compare/nebula-cosmos-max"

export const NEBULA_COSMOS_MAX_VENUE_ROWS: VenuePriceRow[] = [
  {
    id: "gumtree-used",
    venue: "Gumtree",
    kind: "peer_listing",
    priceGbp: 400,
    priceLabel: "Asking price (used, working + stand)",
    url: "https://www.gumtree.com/p/home-cinema/anker-nebula-cosmos-max-4k-projector/1498514251",
    lastCheckedIso: "2026-10-17",
    notes: "Kidderminster example with stand; collection-only. Condition and accessories drive price.",
  },
  {
    id: "cex",
    venue: "CeX (webuy)",
    kind: "trade_in",
    priceGbp: null,
    priceLabel: "Cash / voucher (search live)",
    url: "https://uk.webuy.com/search?stext=nebula%20cosmos%20max",
    lastCheckedIso: "2026-10-17",
    notes:
      "Projectors are unevenly stocked at CeX; open the search and check grade-based buy prices if listed.",
  },
  {
    id: "shpock",
    venue: "Shpock",
    kind: "peer_listing",
    priceGbp: null,
    priceLabel: "Search live UK listings",
    url: "https://www.shpock.com/en-gb/q/nebula%20cosmos%20max",
    lastCheckedIso: "2026-10-17",
    notes: "Confirm 4K / D2150 vs smaller Cosmos models before comparing.",
  },
]
