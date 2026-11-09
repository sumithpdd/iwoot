"use client"

import type { WantProduct } from "@/lib/types/product"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function WantResearchPanel({ product }: { product: WantProduct }) {
  const visits = product.researchVisits || []
  const benchmarks = product.priceBenchmarks || []
  const links = product.researchLinks || []
  const steps = product.buyingPlanSteps || []

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
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Buying research</CardTitle>
        <CardDescription>
          {product.buyingStage
            ? `Stage: ${product.buyingStage.replace(/_/g, " ")}`
            : "Store visits, price benchmarks, and plan — also editable via Gemini / MCP"}
        </CardDescription>
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
            <ul className="space-y-2">
              {benchmarks.map((b) => (
                <li key={b.id} className="rounded-md border p-2">
                  <div className="font-medium">{b.itemLabel}</div>
                  <div className="text-muted-foreground">
                    {b.venue}
                    {b.priceGbp != null && ` · £${b.priceGbp.toLocaleString()}`}
                    {b.priceLocal != null &&
                      b.currency &&
                      ` · ${b.currency} ${b.priceLocal.toLocaleString()}`}
                  </div>
                  {b.specification && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {b.specification}
                    </div>
                  )}
                  {b.url && (
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline underline-offset-2"
                    >
                      Link
                    </a>
                  )}
                </li>
              ))}
            </ul>
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
