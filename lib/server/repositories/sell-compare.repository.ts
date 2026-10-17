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
