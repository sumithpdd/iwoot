/**
 * Sell-compare venue grids — documents live in Firestore `sellComparePages`.
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
  /** ISO date you last verified */
  lastCheckedIso: string
  notes?: string
}

/** Optional product-spec panel shown above the grid (still local UI, not price data). */
export type SellCompareReferencePanel = "airpods-pro-2" | "sonos-move-2"

export type SellComparePage = {
  id: string
  slug: string
  path: string
  title: string
  blurb: string
  intro?: string
  venues: VenuePriceRow[]
  referencePanel?: SellCompareReferencePanel | null
  sortOrder: number
  published: boolean
  createdAt?: string
  updatedAt?: string
}
