import Link from "next/link"
import {
  AIRPODS_PRO_2_PRODUCT_TITLE,
  AIRPODS_PRO_2_VENUE_ROWS,
} from "@/lib/data/airpods-pro-2-venue-prices"
import { SellingVenuePriceGrid } from "@/components/selling-venue-price-grid"
import { AirpodsProductReferencePanel } from "@/components/airpods-product-reference-panel"
import { Button } from "@/components/ui/button"
import { SeedAirpodsDemoButton } from "@/components/seed-airpods-demo-button"

export const metadata = {
  title: "AirPods Pro 2 — sell price comparison | IWOOT",
  description:
    "Compare indicative UK sell / listing prices across Back Market, CeX, Gumtree, and Shpock.",
}

export default function AirPodsPro2SellComparePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Sell / list comparison</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
              {AIRPODS_PRO_2_PRODUCT_TITLE}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground leading-relaxed">
              This grid uses a small static dataset in the repo (
              <code className="rounded bg-muted px-1 py-0.5 text-xs">lib/data/airpods-pro-2-venue-prices.ts</code>
              ). CeX and Back Market usually need a live session to show exact numbers; Gumtree
              shows one example listing we could read from HTML. Respect each site&apos;s terms of
              use; for automation prefer official APIs or manual updates rather than aggressive
              scraping.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/sell-compare">All comparisons</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <SeedAirpodsDemoButton />
          </div>
        </div>

        <div className="mb-8">
          <AirpodsProductReferencePanel />
        </div>

        <SellingVenuePriceGrid rows={AIRPODS_PRO_2_VENUE_ROWS} />
      </div>
    </div>
  )
}
