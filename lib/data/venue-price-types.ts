/**
 * Shared types for static sell-compare venue grids.
 * Product-specific rows live in `lib/data/*-venue-prices.ts`.
 */

export type VenuePriceKind =
  | "peer_listing"
  | "platform_buyback"
  | "trade_in"
  | "refurb_buy_box"

export type VenuePriceRow = {
  id: string
  venue: string
  kind: VenuePriceKind
  /** GBP; null when not reliably available without a live browser session */
  priceGbp: number | null
  priceLabel: string
  url: string
  /** ISO date you last verified or scraped */
  lastCheckedIso: string
  notes?: string
}
