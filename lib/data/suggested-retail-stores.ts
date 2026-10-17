/**
 * Suggested retailer profiles — user can bulk-add to their Firestore `stores` collection
 * (skipped if a store with the same name already exists, case-insensitive).
 */
export type SuggestedRetailStore = {
  name: string
  website?: string
  notes?: string
}

export const SUGGESTED_RETAIL_STORES: SuggestedRetailStore[] = [
  { name: "Amazon", website: "https://www.amazon.co.uk/", notes: "Online" },
  { name: "Joybuy", website: "https://www.joybuy.com/", notes: "International marketplace" },
  { name: "eBay", website: "https://www.ebay.co.uk/", notes: "Marketplace" },
  { name: "Back Market", website: "https://www.backmarket.co.uk/", notes: "Refurb / buyback" },
  { name: "CeX (webuy)", website: "https://uk.webuy.com/", notes: "Trade-in & second-hand" },
  { name: "Currys", website: "https://www.currys.co.uk/", notes: "UK electronics" },
  { name: "Argos", website: "https://www.argos.co.uk/", notes: "UK retail" },
  { name: "Apple Store", website: "https://www.apple.com/uk/", notes: "Official Apple" },
  { name: "Sunglass Hut", website: "https://www.sunglasshut.com/uk", notes: "Ray-Ban / Luxottica retail" },
  { name: "Gumtree", website: "https://www.gumtree.com/", notes: "Classifieds" },
  { name: "Facebook Marketplace", website: "https://www.facebook.com/marketplace/", notes: "Local listings" },
  { name: "Vinted", website: "https://www.vinted.co.uk/", notes: "Fashion & more" },
  { name: "Shpock", website: "https://www.shpock.com/", notes: "Classifieds" },
]
