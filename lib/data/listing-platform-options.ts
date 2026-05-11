/**
 * Preset marketplace labels for “I have” listing multi-select.
 * Values are stored verbatim in `listingPlatforms[]`.
 */
export const LISTING_PLATFORM_PRESETS = [
  "Back Market",
  "CeX (we buy)",
  "Gumtree",
  "Shpock",
  "eBay",
  "Facebook Marketplace",
  "Vinted",
] as const

export type ListingPlatformPreset = (typeof LISTING_PLATFORM_PRESETS)[number]
