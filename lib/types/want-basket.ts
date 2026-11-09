import type {
  BuyingPlanStep,
  BuyingStage,
  PriceBenchmark,
  ResearchLink,
  ResearchVisit,
} from "@/lib/types/want-research"

/**
 * Multi-item “I want” shopping plan (e.g. iPad + two watches + keyboard).
 * Line items are normal `products` with `type: "want"` and `wantBasketId`.
 */
export type WantBasket = {
  id: string
  userId: string
  title: string
  blurb?: string
  buyingStage?: BuyingStage
  /** UK total benchmark for the basket when known */
  targetTotalGbp?: number | null
  currencyNote?: string
  researchVisits?: ResearchVisit[]
  priceBenchmarks?: PriceBenchmark[]
  researchLinks?: ResearchLink[]
  buyingPlanSteps?: BuyingPlanStep[]
  researchSummary?: string
  createdAt?: string
  updatedAt?: string
}
