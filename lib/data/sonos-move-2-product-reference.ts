/**
 * Structured reference for Sonos Move 2 (UK) — sell-compare / UI only.
 * Not loaded from Firestore; update when your own listing details change.
 */
export const SONOS_MOVE_2_REFERENCE = {
  title: "Sonos Move 2",
  summary:
    "Portable stereo smart speaker with Wi‑Fi, Bluetooth, up to ~24h battery, IP56, wireless charging base. RRP typically ~£429–£449 (UK).",
  typicalSpecifications: {
    Connectivity: "Wi‑Fi, Bluetooth, USB‑C",
    Battery: "Up to 24 hours",
    "Water / dust": "IP56",
    Charging: "Wireless charging base included",
    Colours: "Black / White / Olive (and others by region)",
  } as Record<string, string>,
  exampleRetailUrls: [
    "https://www.sonos.com/en-gb/shop/move-2",
    "https://www.sonos.com/en-gb/shop/move-2-b-stock",
  ],
  peerListingNote:
    "UK peer ads (Gumtree) for new / nearly-new Move 2 often land around £275–£300; used units vary. Always confirm the live ad. Shpock stock fluctuates — use the search link on the compare page.",
} as const
