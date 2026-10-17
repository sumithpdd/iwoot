"use client"

import Link from "next/link"
import type { VenuePriceRow } from "@/lib/types/sell-compare"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

const KIND_LABEL: Record<VenuePriceRow["kind"], string> = {
  peer_listing: "Private listing",
  platform_buyback: "Platform buyback",
  trade_in: "Trade-in / cash",
  refurb_buy_box: "Refurb buy box",
}

function formatGbp(amount: number | null): string {
  if (amount === null) return "—"
  return `£${amount.toFixed(2)}`
}

export function SellingVenuePriceGrid({ rows }: { rows: VenuePriceRow[] }) {
  return (
    <div className="space-y-6">
      <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Venue</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Price (GBP)</TableHead>
              <TableHead>How it is priced</TableHead>
              <TableHead className="w-[100px]">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.venue}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {KIND_LABEL[r.kind]}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatGbp(r.priceGbp)}
                </TableCell>
                <TableCell className="max-w-md text-sm text-muted-foreground">
                  <div>{r.priceLabel}</div>
                  {r.notes && <div className="mt-1 text-xs">{r.notes}</div>}
                  <div className="mt-1 text-xs">Checked: {r.lastCheckedIso}</div>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" asChild>
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      Open
                      <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden />
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 md:hidden sm:grid-cols-2">
        {rows.map((r) => (
          <Card key={r.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{r.venue}</CardTitle>
              <CardDescription>{KIND_LABEL[r.kind]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  r.priceGbp === null && "text-muted-foreground text-xl"
                )}
              >
                {formatGbp(r.priceGbp)}
              </p>
              <p className="text-sm text-muted-foreground">{r.priceLabel}</p>
              {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
              <p className="text-xs text-muted-foreground">Checked: {r.lastCheckedIso}</p>
              <Button variant="default" size="sm" className="w-full" asChild>
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                  Open listing / site
                  <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-sm text-muted-foreground">
        <Button variant="link" asChild className="h-auto p-0">
          <Link href="/sell-compare">All comparisons</Link>
        </Button>
        <span className="hidden sm:inline" aria-hidden>
          ·
        </span>
        <Button variant="link" asChild className="h-auto p-0">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </p>
    </div>
  )
}
