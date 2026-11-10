"use client"

import type { WantProduct } from "@/lib/types/product"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function gbpRange(benchmarks: NonNullable<WantProduct["priceBenchmarks"]>) {
  const gbp = benchmarks
    .map((b) => b.priceGbp)
    .filter((n): n is number => typeof n === "number" && !Number.isNaN(n))
  if (gbp.length === 0) return null
  const min = Math.min(...gbp)
  const max = Math.max(...gbp)
  return { min, max }
}

export function WantResearchPanel({ product }: { product: WantProduct }) {
  const visits = product.researchVisits || []
  const benchmarks = product.priceBenchmarks || []
  const links = product.researchLinks || []
  const steps = product.buyingPlanSteps || []
  const range = gbpRange(benchmarks)

  if (
    !product.researchSummary &&
    !product.buyingStage &&
    visits.length === 0 &&
    benchmarks.length === 0 &&
    links.length === 0 &&
    steps.length === 0
  ) {
    return null
  }

  return (
    <Card className="border-sky-200/80 bg-gradient-to-br from-sky-50/80 to-white dark:from-sky-950/40 dark:to-gray-950 dark:border-sky-900">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Price research</CardTitle>
            <CardDescription>
              {product.buyingStage
                ? `Stage: ${product.buyingStage.replace(/_/g, " ")}`
                : "Benchmarks, visits, and plan — also via Gemini / MCP"}
            </CardDescription>
          </div>
          {range ? (
            <div className="rounded-lg border border-sky-200 bg-white/90 px-3 py-2 text-right shadow-sm dark:border-sky-800 dark:bg-gray-900/80">
              <p className="text-[11px] uppercase tracking-wide text-sky-700 dark:text-sky-300">
                Seen prices
              </p>
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {range.min === range.max
                  ? `£${range.min.toLocaleString()}`
                  : `£${range.min.toLocaleString()} – £${range.max.toLocaleString()}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {benchmarks.length} benchmark{benchmarks.length === 1 ? "" : "s"}
              </p>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {product.researchSummary && (
          <p className="text-muted-foreground whitespace-pre-wrap">
            {product.researchSummary}
          </p>
        )}

        {benchmarks.length > 0 && (
          <div>
            <p className="font-medium text-foreground mb-2">Price benchmarks</p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Item</th>
                    <th className="px-3 py-2 font-medium">Venue</th>
                    <th className="px-3 py-2 font-medium">GBP</th>
                    <th className="px-3 py-2 font-medium">Local</th>
                    <th className="px-3 py-2 font-medium">Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarks.map((b) => (
                    <tr key={b.id} className="border-t align-top">
                      <td className="px-3 py-2">
                        <div className="font-medium">{b.itemLabel}</div>
                        {b.specification ? (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {b.specification}
                          </div>
                        ) : null}
                        {b.url ? (
                          <a
                            href={b.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline underline-offset-2"
                          >
                            Open
                          </a>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{b.venue}</td>
                      <td className="px-3 py-2 tabular-nums font-medium">
                        {b.priceGbp != null ? `£${b.priceGbp.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">
                        {b.priceLocal != null && b.currency
                          ? `${b.currency} ${b.priceLocal.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {b.lastCheckedIso
                          ? b.lastCheckedIso.slice(0, 10)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {visits.length > 0 && (
          <div>
            <p className="font-medium text-foreground mb-2">Research visits</p>
            <ul className="space-y-2">
              {visits.map((v) => (
                <li key={v.id} className="rounded-md border p-2">
                  <div className="font-medium">
                    {v.place}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({v.kind.replace(/_/g, " ")}) · {v.checkedAt}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                    {v.whatFound}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {steps.length > 0 && (
          <div>
            <p className="font-medium text-foreground mb-2">Buying plan</p>
            <ol className="list-decimal pl-5 space-y-2">
              {steps
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((s) => (
                  <li key={s.id}>
                    <span className={s.done ? "line-through text-muted-foreground" : ""}>
                      {s.title}
                    </span>
                    {s.detail && (
                      <p className="text-muted-foreground text-xs mt-0.5">{s.detail}</p>
                    )}
                  </li>
                ))}
            </ol>
          </div>
        )}

        {links.length > 0 && (
          <div>
            <p className="font-medium text-foreground mb-2">Links</p>
            <ul className="space-y-1">
              {links.map((l) => (
                <li key={l.id}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Compact strip for product cards / table rows */
export function WantPriceResearchBadge({ product }: { product: WantProduct }) {
  const benchmarks = product.priceBenchmarks || []
  const range = gbpRange(benchmarks)
  const stage = product.buyingStage
  if (!range && !stage && benchmarks.length === 0) return null

  return (
    <div className="mt-2 rounded-md border border-sky-200/80 bg-sky-50/90 px-2.5 py-1.5 text-xs dark:border-sky-900 dark:bg-sky-950/50">
      <span className="font-semibold text-sky-900 dark:text-sky-100">
        Price research
      </span>
      {range ? (
        <span className="ml-2 tabular-nums text-sky-950 dark:text-sky-50">
          {range.min === range.max
            ? `£${range.min.toLocaleString()}`
            : `£${range.min.toLocaleString()}–£${range.max.toLocaleString()}`}
        </span>
      ) : null}
      {benchmarks.length > 0 ? (
        <span className="ml-2 text-muted-foreground">
          · {benchmarks.length} venue{benchmarks.length === 1 ? "" : "s"}
        </span>
      ) : null}
      {stage ? (
        <span className="ml-2 text-muted-foreground">
          · {stage.replace(/_/g, " ")}
        </span>
      ) : null}
    </div>
  )
}
