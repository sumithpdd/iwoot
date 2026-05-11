"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Camera, Receipt, Scale, Sparkles, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

type SellingJourneyCardProps = {
  storeCount: number
  haveProductCount: number
  receiptCount: number
  onOpenStoresTab: () => void
  onOpenAddStore: () => void
  onOpenHaveProduct: () => void
  onOpenReceiptsTab: () => void
}

function Step({
  done,
  icon: Icon,
  title,
  children,
  className,
}: {
  done?: boolean
  icon: typeof Building2
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-border bg-card/60 p-3 sm:p-4",
        done && "border-emerald-500/40 bg-emerald-500/5",
        className
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
          done ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"
        )}
      >
        {done ? <CheckCircle2 className="h-5 w-5" aria-hidden /> : <Icon className="h-5 w-5" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-semibold leading-tight text-foreground">{title}</p>
        {children}
      </div>
    </div>
  )
}

export function SellingJourneyCard({
  storeCount,
  haveProductCount,
  receiptCount,
  onOpenStoresTab,
  onOpenAddStore,
  onOpenHaveProduct,
  onOpenReceiptsTab,
}: SellingJourneyCardProps) {
  const hasStores = storeCount > 0
  const hasHave = haveProductCount > 0

  return (
    <Card className="border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white shadow-sm dark:border-blue-900/40 dark:from-blue-950/40 dark:to-card">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden />
              Sell on marketplaces — quick path
            </CardTitle>
            <CardDescription className="mt-1 max-w-3xl text-sm leading-relaxed">
              Add where you shop, log what you own with photos, then use price compare as a sanity check before you list
              (Gumtree, Vinted, eBay, CeX, Back Market, etc.).
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/sell-compare">
              <Scale className="mr-1.5 h-4 w-4" aria-hidden />
              Price compare
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Step done={hasStores} icon={Building2} title="1. Save a store (optional but handy)">
          <p className="text-xs text-muted-foreground sm:text-sm">
            CeX, Currys, Apple — so “I have” items and receipts stay organised.
            {hasStores ? ` You have ${storeCount} saved.` : " None yet."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={onOpenStoresTab}>
              Open Stores tab
            </Button>
            <Button type="button" size="sm" onClick={onOpenAddStore}>
              Add store
            </Button>
          </div>
        </Step>

        <Step done={hasHave} icon={Camera} title="2. Add an “I have” product + images">
          <p className="text-xs text-muted-foreground sm:text-sm">
            Paste a listing URL, upload clear photos (serial, condition), set price paid. Set listing status to Selling and
            add each platform when you list it.
            {hasHave ? ` ${haveProductCount} item(s) in your list.` : " Start with one item."}
          </p>
          <Button type="button" size="sm" onClick={onOpenHaveProduct}>
            Add “I have” product
          </Button>
        </Step>

        <Step icon={Scale} title="3. Compare resale numbers">
          <p className="text-xs text-muted-foreground sm:text-sm">
            Example grids (e.g. AirPods Pro 2) are reference only — update figures from each site when you list.
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link href="/sell-compare">Open compare hub</Link>
          </Button>
        </Step>

        <Step done={receiptCount > 0} icon={Receipt} title="4. Receipts (optional)">
          <p className="text-xs text-muted-foreground sm:text-sm">
            Snap a receipt to remember warranty and price; you can spawn a store profile from it later.
            {receiptCount > 0 ? ` ${receiptCount} saved.` : " None yet."}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={onOpenReceiptsTab}>
            Open Receipts tab
          </Button>
        </Step>
      </CardContent>
    </Card>
  )
}
