import Link from "next/link"
import {
  SONOS_MOVE_2_PRODUCT_TITLE,
  SONOS_MOVE_2_VENUE_ROWS,
} from "@/lib/data/sonos-move-2-venue-prices"
import { SellingVenuePriceGrid } from "@/components/selling-venue-price-grid"
import { SonosMove2ProductReferencePanel } from "@/components/sonos-move-2-product-reference-panel"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Sonos Move 2 — sell price comparison | IWOOT",
  description:
    "Compare indicative UK sell / listing prices for Sonos Move 2 on Gumtree and Shpock.",
}

export default function SonosMove2SellComparePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Sell / list comparison</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
              {SONOS_MOVE_2_PRODUCT_TITLE}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground leading-relaxed">
              Static dataset in{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                lib/data/sonos-move-2-venue-prices.ts
              </code>
              . Gumtree rows use example asking prices from live ads (verified when last checked).
              Shpock uses a search link when a single stable UK ad is not available. Confirm on the
              live site before you price your own listing. This page is static reference data — it
              is not your dashboard inventory.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/sell-compare">All comparisons</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <SonosMove2ProductReferencePanel />
        </div>

        <SellingVenuePriceGrid rows={SONOS_MOVE_2_VENUE_ROWS} />
      </div>
    </div>
  )
}
