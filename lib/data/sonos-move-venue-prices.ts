/**
 * Reference prices for selling original Sonos Move (S17 / Gen 1) — UK.
 * Not Move 2. Update when you re-check each marketplace.
 */

import type { VenuePriceRow } from "@/lib/data/venue-price-types"

export type { VenuePriceKind, VenuePriceRow } from "@/lib/data/venue-price-types"

export const SONOS_MOVE_PRODUCT_TITLE =
  "Sonos Move (original / Gen 1, model S17 — black, with charging cradle)"

export const SONOS_MOVE_COMPARE_PATH = "/sell-compare/sonos-move"

export const SONOS_MOVE_VENUE_ROWS: VenuePriceRow[] = [
  {
    id: "gumtree-excellent",
    venue: "Gumtree",
    kind: "peer_listing",
    priceGbp: 220,
    priceLabel: "Asking price (excellent, box + cradle)",
    url: "https://www.gumtree.com/p/speakers/sonos-move-portable-smart-speaker-gen-i-in-black.-excellent-condition/1802007275",
    lastCheckedIso: "2026-10-17",
    notes: "Edinburgh Gen I example; lightly used. Other ads differ by area and condition.",
  },
  {
    id: "gumtree-used",
    venue: "Gumtree",
    kind: "peer_listing",
    priceGbp: 180,
    priceLabel: "Asking price (as good as new)",
    url: "https://www.gumtree.com/p/speakers/sonos-move-gen-1-portable-bluetooth-speaker/1515263003",
    lastCheckedIso: "2026-10-17",
    notes: "Dundee Gen 1 example; collection-only. Use as a floor for local asking prices.",
  },
  {
    id: "cex",
    venue: "CeX (webuy)",
    kind: "trade_in",
    priceGbp: null,
    priceLabel: "Cash / voucher (search live)",
    url: "https://uk.webuy.com/search?stext=sonos%20move",
    lastCheckedIso: "2026-10-17",
    notes:
      "Confirm Gen 1 vs Move 2 on the product page. Trade-in is usually below private-sale asking prices.",
  },
  {
    id: "shpock",
    venue: "Shpock",
    kind: "peer_listing",
    priceGbp: null,
    priceLabel: "Search live UK listings",
    url: "https://www.shpock.com/en-gb/q/sonos%20move",
    lastCheckedIso: "2026-10-17",
    notes: "Filter out Move 2 ads. Verify colour, cradle, and battery health before matching a price.",
  },
]
