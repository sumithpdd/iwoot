import Link from "next/link"
import { notFound } from "next/navigation"
import { SellingVenuePriceGrid } from "@/components/selling-venue-price-grid"
import { AirpodsProductReferencePanel } from "@/components/airpods-product-reference-panel"
import { SonosMove2ProductReferencePanel } from "@/components/sonos-move-2-product-reference-panel"
import { Button } from "@/components/ui/button"
import { getSellComparePageBySlug } from "@/lib/server/repositories/sell-compare.repository"
import type { VenuePriceRow } from "@/lib/types/sell-compare"

type PageProps = { params: { slug: string } }

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PageProps) {
  const page = await getSellComparePageBySlug(params.slug)
  if (!page) return { title: "Sell compare | IWOOT" }
  return {
    title: `${page.title} — sell price comparison | IWOOT`,
    description: page.blurb,
  }
}

export default async function SellCompareSlugPage({ params }: PageProps) {
  const page = await getSellComparePageBySlug(params.slug)
  if (!page) notFound()

  const venues = page.venues as VenuePriceRow[]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Sell / list comparison</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
              {page.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground leading-relaxed">
              {page.intro ||
                "UK venue reference from Firestore. Confirm live prices before you list. This is not your dashboard inventory."}
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

        {page.referencePanel === "airpods-pro-2" && (
          <div className="mb-8">
            <AirpodsProductReferencePanel venues={venues} />
          </div>
        )}
        {page.referencePanel === "sonos-move-2" && (
          <div className="mb-8">
            <SonosMove2ProductReferencePanel venues={venues} />
          </div>
        )}

        <SellingVenuePriceGrid rows={venues} />
      </div>
    </div>
  )
}
