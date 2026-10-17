import { AIRPODS_PRO_2_REFERENCE } from "@/lib/data/airpods-pro-2-product-reference"
import type { VenuePriceRow } from "@/lib/types/sell-compare"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function AirpodsProductReferencePanel({
  venues,
}: {
  venues: VenuePriceRow[]
}) {
  const gumtree = venues.find((r) => r.id === "gumtree")

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">Reference: {AIRPODS_PRO_2_REFERENCE.title}</CardTitle>
        <CardDescription>{AIRPODS_PRO_2_REFERENCE.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="font-medium text-foreground">Typical specs (illustrative)</p>
          <ul className="mt-2 list-inside list-disc text-muted-foreground">
            {Object.entries(AIRPODS_PRO_2_REFERENCE.typicalSpecifications).map(([k, v]) => (
              <li key={k}>
                <span className="font-medium text-foreground">{k}:</span> {v}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-medium text-foreground">Example peer listing</p>
          <p className="mt-1 text-muted-foreground">{AIRPODS_PRO_2_REFERENCE.peerListingNote}</p>
          {gumtree?.priceGbp != null && (
            <p className="mt-1 text-muted-foreground">
              Grid example:{" "}
              <span className="font-semibold text-foreground">
                £{gumtree.priceGbp.toFixed(2)}
              </span>{" "}
              ({gumtree.priceLabel}).
            </p>
          )}
        </div>
        <div>
          <p className="font-medium text-foreground">Example URLs for your product record</p>
          <ul className="mt-2 space-y-1 break-all font-mono text-xs text-muted-foreground">
            {AIRPODS_PRO_2_REFERENCE.exampleRetailUrls.map((u) => (
              <li key={u}>
                <a
                  href={u}
                  className="underline hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
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
