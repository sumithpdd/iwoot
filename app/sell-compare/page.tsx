import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Scale } from "lucide-react"

export const metadata = {
  title: "Resale price compare | IWOOT",
  description: "Reference price grids for second-hand marketplaces.",
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
              Static reference pages — edit data in the repo when you check each marketplace. Not live scraping.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Apple AirPods Pro 2</CardTitle>
            <CardDescription>
              Back Market, CeX, Gumtree, Shpock — side-by-side grid with links.
            </CardDescription>
            <Button className="mt-4 w-fit" asChild>
              <Link href="/sell-compare/airpods-pro-2">
                Open comparison
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
