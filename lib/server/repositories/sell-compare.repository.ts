import { getAdminFirestore } from "@/lib/server/firebase-admin"
import type {
  SellComparePage,
  SellCompareReferencePanel,
  VenuePriceRow,
} from "@/lib/types/sell-compare"

function asReferencePanel(
  value: unknown
): SellCompareReferencePanel | null {
  if (value === "airpods-pro-2" || value === "sonos-move-2") return value
  return null
}

const COLLECTION = "sellComparePages"

function mapDoc(id: string, data: Record<string, unknown>): SellComparePage {
  const venues = Array.isArray(data.venues)
    ? (data.venues as VenuePriceRow[])
    : []
  return {
    id,
    slug: String(data.slug || id),
    path: String(data.path || `/sell-compare/${id}`),
    title: String(data.title || id),
    blurb: String(data.blurb || ""),
    intro: data.intro ? String(data.intro) : undefined,
    venues,
    referencePanel: asReferencePanel(data.referencePanel),
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
    published: data.published !== false,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
  }
}

export async function listSellComparePages(
  opts?: { publishedOnly?: boolean }
): Promise<SellComparePage[]> {
  const db = getAdminFirestore()
  const snapshot = await db.collection(COLLECTION).get()
  let pages = snapshot.docs.map((d) =>
    mapDoc(d.id, d.data() as Record<string, unknown>)
  )
  if (opts?.publishedOnly !== false) {
    pages = pages.filter((p) => p.published)
  }
  return pages.sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug))
}

export async function getSellComparePageBySlug(
  slug: string
): Promise<SellComparePage | null> {
  const db = getAdminFirestore()
  const key = slug.trim()
  if (!key) return null

  const byId = await db.collection(COLLECTION).doc(key).get()
  if (byId.exists) {
    const page = mapDoc(byId.id, byId.data() as Record<string, unknown>)
    return page.published ? page : null
  }

  const bySlug = await db
    .collection(COLLECTION)
    .where("slug", "==", key)
    .limit(1)
    .get()
  if (bySlug.empty) return null
  const doc = bySlug.docs[0]
  const page = mapDoc(doc.id, doc.data() as Record<string, unknown>)
  return page.published ? page : null
}

export async function upsertSellComparePage(
  slug: string,
  data: Omit<SellComparePage, "id" | "createdAt" | "updatedAt"> & {
    createdAt?: string
  }
): Promise<void> {
  const db = getAdminFirestore()
  const now = new Date().toISOString()
  const ref = db.collection(COLLECTION).doc(slug)
  const existing = await ref.get()
  await ref.set(
    {
      ...data,
      slug,
      path: data.path || `/sell-compare/${slug}`,
      updatedAt: now,
      createdAt: existing.exists
        ? existing.data()?.createdAt || now
        : data.createdAt || now,
    },
    { merge: true }
  )
}

/**
 * Insert or replace a “your live listing” venue row.
 * Live Gumtree/Shpock rows stay at the top; drops prior row with same id/url
 * and generic same-venue search rows (null price) when replacing with a live ask.
 */
export async function upsertLiveVenueRow(
  slug: string,
  venue: VenuePriceRow
): Promise<void> {
  const db = getAdminFirestore()
  const ref = db.collection(COLLECTION).doc(slug)
  const snap = await ref.get()
  if (!snap.exists) {
    throw new Error(`sellComparePages/${slug} not found`)
  }
  const data = snap.data() as Record<string, unknown>
  const existing = Array.isArray(data.venues)
    ? ([...data.venues] as VenuePriceRow[])
    : []

  const venueKey = venue.venue.toLowerCase()
  const filtered = existing.filter((v) => {
    if (v.id === venue.id || v.url === venue.url) return false
    if (
      v.venue.toLowerCase() === venueKey &&
      v.priceGbp == null &&
      !String(v.id).includes("live-own")
    ) {
      return false
    }
    return true
  })

  const liveOwn = filtered.filter((v) => String(v.id).endsWith("-live-own"))
  const rest = filtered.filter((v) => !String(v.id).endsWith("-live-own"))
  const withoutNew = liveOwn.filter((v) => v.id !== venue.id)
  const nextLive = [venue, ...withoutNew].sort((a, b) => {
    const rank = (id: string) =>
      id.startsWith("gumtree") ? 0 : id.startsWith("shpock") ? 1 : 2
    return rank(a.id) - rank(b.id)
  })

  const now = new Date().toISOString()
  await ref.set(
    {
      venues: [...nextLive, ...rest],
      updatedAt: now,
    },
    { merge: true }
  )
}
