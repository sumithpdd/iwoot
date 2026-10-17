/**
 * Reference prices for comparing where to sell Sonos Move 2 (UK).
 * Peer listings move quickly — update when you re-check Gumtree / Shpock.
 */

import type { VenuePriceRow } from "@/lib/data/venue-price-types"

export type { VenuePriceKind, VenuePriceRow } from "@/lib/data/venue-price-types"

export const SONOS_MOVE_2_PRODUCT_TITLE =
  "Sonos Move 2 (portable Wi‑Fi / Bluetooth speaker — check colour & condition)"

export const SONOS_MOVE_2_VENUE_ROWS: VenuePriceRow[] = [
  {
    id: "gumtree-new",
    venue: "Gumtree",
    kind: "peer_listing",
    priceGbp: 275,
    priceLabel: "Asking price (brand new, sealed)",
    url: "https://www.gumtree.com/p/speakers/sonos-move-2-portable-smart-speaker-brand-new/1514906483",
    lastCheckedIso: "2026-08-08",
    notes: "Olive Green, unwanted gift, Leicester — private ad; other listings differ.",
  },
  {
    id: "gumtree-used",
    venue: "Gumtree",
    kind: "peer_listing",
    priceGbp: 300,
    priceLabel: "Asking price (as good as new)",
    url: "https://www.gumtree.com/p/speakers/sonos-move-gen-2-smart-bluetooth-portable-speaker/1512559113",
    lastCheckedIso: "2026-08-08",
    notes: "Dundee listing; seller notes RRP ~£449. Collection-only.",
  },
  {
    id: "shpock",
    venue: "Shpock",
    kind: "peer_listing",
    priceGbp: null,
    priceLabel: "Search live UK listings",
    url: "https://www.shpock.com/en-gb/q/sonos%20move%202",
    lastCheckedIso: "2026-08-08",
    notes:
      "No stable UK Move 2 ad at check time; open search and verify asking prices before you list.",
  },
]
