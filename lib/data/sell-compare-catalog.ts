/**
 * Registry of static sell-compare pages (not Firestore inventory).
 */

import {
  AIRPODS_PRO_2_PRODUCT_TITLE,
  AIRPODS_PRO_2_VENUE_ROWS,
} from "@/lib/data/airpods-pro-2-venue-prices"
import {
  NEBULA_COSMOS_MAX_PRODUCT_TITLE,
  NEBULA_COSMOS_MAX_VENUE_ROWS,
} from "@/lib/data/nebula-cosmos-max-venue-prices"
import {
  SONOS_MOVE_PRODUCT_TITLE,
  SONOS_MOVE_VENUE_ROWS,
} from "@/lib/data/sonos-move-venue-prices"
import {
  SONOS_MOVE_2_PRODUCT_TITLE,
  SONOS_MOVE_2_VENUE_ROWS,
} from "@/lib/data/sonos-move-2-venue-prices"
import type { VenuePriceRow } from "@/lib/data/venue-price-types"

export type SellCompareSlug =
  | "airpods-pro-2"
  | "sonos-move"
  | "sonos-move-2"
  | "nebula-cosmos-max"

export type SellCompareEntry = {
  slug: SellCompareSlug
  path: string
  title: string
  blurb: string
  rows: VenuePriceRow[]
}

export const SELL_COMPARE_CATALOG: SellCompareEntry[] = [
  {
    slug: "sonos-move",
    path: "/sell-compare/sonos-move",
    title: SONOS_MOVE_PRODUCT_TITLE,
    blurb: "Gumtree asking prices, CeX search, Shpock — original Move (S17), not Move 2.",
    rows: SONOS_MOVE_VENUE_ROWS,
  },
  {
    slug: "nebula-cosmos-max",
    path: "/sell-compare/nebula-cosmos-max",
    title: NEBULA_COSMOS_MAX_PRODUCT_TITLE,
    blurb: "Gumtree example asking price plus CeX / Shpock search for D2150.",
    rows: NEBULA_COSMOS_MAX_VENUE_ROWS,
  },
  {
    slug: "airpods-pro-2",
    path: "/sell-compare/airpods-pro-2",
    title: AIRPODS_PRO_2_PRODUCT_TITLE,
    blurb: "Back Market, CeX, Gumtree, Shpock.",
    rows: AIRPODS_PRO_2_VENUE_ROWS,
  },
  {
    slug: "sonos-move-2",
    path: "/sell-compare/sonos-move-2",
    title: SONOS_MOVE_2_PRODUCT_TITLE,
    blurb: "Move 2 reference only — your tracker item is original Move (S17).",
    rows: SONOS_MOVE_2_VENUE_ROWS,
  },
]

export function getSellCompareBySlug(slug: string): SellCompareEntry | undefined {
  return SELL_COMPARE_CATALOG.find((e) => e.slug === slug)
}
