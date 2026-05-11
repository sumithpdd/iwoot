import type { ProductImageEntry } from "@/lib/types/product"

const MAX_TAGS_PER_IMAGE = 20
const MAX_TAG_LENGTH = 50

/**
 * Normalizes legacy `string[]` or mixed API payloads into `{ url, tags? }[]`.
 */
export function normalizeProductImages(raw: unknown): ProductImageEntry[] {
  if (!Array.isArray(raw)) return []
  const out: ProductImageEntry[] = []
  for (const item of raw) {
    if (typeof item === "string") {
      const url = item.trim()
      if (url) out.push({ url, tags: [] })
      continue
    }
    if (item && typeof item === "object" && "url" in item) {
      const url = String((item as { url: unknown }).url || "").trim()
      if (!url) continue
      let tags: string[] | undefined
      const rawTags = (item as { tags?: unknown }).tags
      if (Array.isArray(rawTags)) {
        const cleaned = rawTags
          .map((t) => (typeof t === "string" ? t.trim() : ""))
          .filter(Boolean)
          .slice(0, MAX_TAGS_PER_IMAGE)
          .map((t) => t.slice(0, MAX_TAG_LENGTH))
        if (cleaned.length) tags = [...new Set(cleaned)]
      }
      out.push(tags?.length ? { url, tags } : { url, tags: [] })
    }
  }
  return out
}

/** Drop empty tag arrays for smaller Firestore payloads */
export function compactImageEntries(
  entries: ProductImageEntry[]
): ProductImageEntry[] {
  return entries.map((e) => {
    const tags = e.tags?.filter((t) => t.trim().length > 0)
    return tags?.length ? { url: e.url, tags } : { url: e.url }
  })
}

export function sanitizeImageEntriesForSave(
  entries: ProductImageEntry[]
): ProductImageEntry[] | undefined {
  const compact = compactImageEntries(
    entries
      .map((e) => ({
        url: e.url.trim(),
        tags: (e.tags || [])
          .map((t) => t.trim().slice(0, MAX_TAG_LENGTH))
          .filter(Boolean)
          .slice(0, MAX_TAGS_PER_IMAGE),
      }))
      .filter((e) => e.url.length > 0)
  )
  return compact.length ? compact : undefined
}

/** Persist-ready list, or `undefined` if nothing to store. */
export function coerceProductImagesForPersist(
  raw: unknown
): ProductImageEntry[] | undefined {
  const n = normalizeProductImages(raw)
  if (n.length === 0) return undefined
  return compactImageEntries(n)
}
