"use client"

import {
  SONOS_MOVE_2_REFERENCE,
} from "@/lib/data/sonos-move-2-product-reference"
import {
  SONOS_MOVE_2_VENUE_ROWS,
} from "@/lib/data/sonos-move-2-venue-prices"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SonosMove2ProductReferencePanel() {
  const gumtree = SONOS_MOVE_2_VENUE_ROWS.filter((r) => r.venue === "Gumtree")
  const prices = gumtree
    .map((r) => (r.priceGbp != null ? `£${r.priceGbp}` : null))
    .filter(Boolean)
    .join(" / ")

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Reference: {SONOS_MOVE_2_REFERENCE.title}</CardTitle>
        <CardDescription>{SONOS_MOVE_2_REFERENCE.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="font-medium text-foreground">Typical specs</p>
          <dl className="mt-2 grid gap-1 sm:grid-cols-2">
            {Object.entries(SONOS_MOVE_2_REFERENCE.typicalSpecifications).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-muted-foreground shrink-0">{k}:</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <p className="font-medium text-foreground">Peer listing note</p>
          <p className="mt-1 text-muted-foreground">{SONOS_MOVE_2_REFERENCE.peerListingNote}</p>
          {prices && (
            <p className="mt-2 text-muted-foreground">
              Current Gumtree examples in the grid: <strong className="text-foreground">{prices}</strong>
            </p>
          )}
        </div>
        <div>
          <p className="font-medium text-foreground">Retail / refurb pages</p>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">
            {SONOS_MOVE_2_REFERENCE.exampleRetailUrls.map((u) => (
              <li key={u} className="truncate">
                <a
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  {u}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
