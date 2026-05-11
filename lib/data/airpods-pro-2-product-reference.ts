/**
 * Structured reference for Apple AirPods Pro 2 (UK) — for UI / compare pages only.
 * Not loaded from Firestore; update when your own listing or catalog details change.
 */
export const AIRPODS_PRO_2_REFERENCE = {
  title: "Apple AirPods Pro 2 (2nd generation)",
  summary:
    "USB‑C / MagSafe charging case variants; check exact SKU (e.g. MTJV3) on Apple or retailer pages.",
  typicalSpecifications: {
    Chip: "H2",
    "Active noise cancellation": "Yes",
    "Charging case": "MagSafe (USB‑C) or Lightning generation — verify yours",
    "Spatial audio": "Yes",
  } as Record<string, string>,
  /** Example retail / listing URLs you may attach as the product `website` */
  exampleRetailUrls: [
    "https://www.apple.com/uk/airpods-pro/",
    "https://www.backmarket.co.uk/en-gb/p/airpods-pro-2-2022-with-charging-case-magsafe-white/9d3806a1-ff82-4818-bdd0-b295a4929e1e",
  ],
  /** Peer listing example (price moves — see sell-compare venue grid) */
  peerListingNote:
    "Example Gumtree-style listings often land around £80–£100 for used sets; always verify live ads.",
} as const
