import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Scale } from "lucide-react"
import { SELL_COMPARE_CATALOG } from "@/lib/data/sell-compare-catalog"

export const metadata = {
  title: "Resale price compare | IWOOT",
  description: "Reference price grids for Gumtree, CeX, Shpock, and more.",
}

export default function SellCompareHubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Sell / list</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Scale className="h-7 w-7 text-blue-600 dark:text-blue-400" aria-hidden />
              Price compare hub
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Static reference for Gumtree, CeX, and Shpock — edit repo data when you re-check. Not
              live scraping. Your saved tracker is on the dashboard.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>

        <div className="space-y-4">
          {SELL_COMPARE_CATALOG.map((entry) => (
            <Card key={entry.slug}>
              <CardHeader>
                <CardTitle className="text-base">{entry.title}</CardTitle>
                <CardDescription>{entry.blurb}</CardDescription>
                <Button className="mt-4 w-fit" asChild>
                  <Link href={entry.path}>
                    Open comparison
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
