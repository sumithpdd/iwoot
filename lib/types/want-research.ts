/**
 * Buy-side research for “I want” items — store visits, price benchmarks, plan steps.
 * Embedded on want products and/or want baskets (Firestore).
 */

export type BuyingStage =
  | "researching"
  | "shortlisted"
  | "ready_to_buy"
  | "ordered"
  | "bought"
  | "cancelled"

/** End-of-life for items you already have (beyond marketplace “sold”). */
export type HaveDisposition = "kept" | "selling" | "sold" | "gifted" | "recycled"

export type ResearchVisitKind =
  | "visited_store"
  | "checked_online"
  | "tried_on"
  | "spoke_to_staff"
  | "other"

export type ResearchVisit = {
  id: string
  /** Store or site name, e.g. "Best Buy Millenia" */
  place: string
  kind: ResearchVisitKind
  /** ISO date when you checked */
  checkedAt: string
  whatFound: string
  url?: string
  priceLocal?: number
  currency?: string
  notes?: string
}

export type PriceBenchmark = {
  id: string
  /** What the price is for (e.g. "13-inch iPad Pro 1TB nano-texture") */
  itemLabel: string
  venue: string
  priceGbp: number | null
  /** Original currency amount when not GBP */
  priceLocal?: number | null
  currency?: string
  url?: string
  lastCheckedIso: string
  notes?: string
  /** Exact config / SKU you care about */
  specification?: string
}

export type ResearchLink = {
  id: string
  label: string
  url: string
  notes?: string
}

export type BuyingPlanStep = {
  id: string
  order: number
  title: string
  detail?: string
  done?: boolean
  links?: ResearchLink[]
}
