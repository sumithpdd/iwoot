import { getAdminFirestore } from "@/lib/server/firebase-admin"
import type { WantBasket } from "@/lib/types/want-basket"

const COLLECTION = "wantBaskets"

function mapDoc(id: string, data: Record<string, unknown>): WantBasket {
  return {
    id,
    userId: String(data.userId || ""),
    title: String(data.title || id),
    blurb: data.blurb ? String(data.blurb) : undefined,
    buyingStage: data.buyingStage as WantBasket["buyingStage"],
    targetTotalGbp:
      typeof data.targetTotalGbp === "number" ? data.targetTotalGbp : null,
    currencyNote: data.currencyNote ? String(data.currencyNote) : undefined,
    researchVisits: Array.isArray(data.researchVisits)
      ? (data.researchVisits as WantBasket["researchVisits"])
      : [],
    priceBenchmarks: Array.isArray(data.priceBenchmarks)
      ? (data.priceBenchmarks as WantBasket["priceBenchmarks"])
      : [],
    researchLinks: Array.isArray(data.researchLinks)
      ? (data.researchLinks as WantBasket["researchLinks"])
      : [],
    buyingPlanSteps: Array.isArray(data.buyingPlanSteps)
      ? (data.buyingPlanSteps as WantBasket["buyingPlanSteps"])
      : [],
    researchSummary: data.researchSummary
      ? String(data.researchSummary)
      : undefined,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
  }
}

export async function listWantBasketsByUser(userId: string): Promise<WantBasket[]> {
  const db = getAdminFirestore()
  const snap = await db.collection(COLLECTION).where("userId", "==", userId).get()
  return snap.docs
    .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
}

export async function getWantBasketById(id: string): Promise<WantBasket | null> {
  const db = getAdminFirestore()
  const snap = await db.collection(COLLECTION).doc(id).get()
  if (!snap.exists) return null
  return mapDoc(snap.id, snap.data() as Record<string, unknown>)
}

export async function createWantBasketDoc(
  data: Omit<WantBasket, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const db = getAdminFirestore()
  const now = new Date().toISOString()
  const ref = await db.collection(COLLECTION).add({
    ...data,
    createdAt: now,
    updatedAt: now,
  })
  return ref.id
}

export async function createWantBasketDocWithId(
  id: string,
  data: Omit<WantBasket, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const db = getAdminFirestore()
  const now = new Date().toISOString()
  await db.collection(COLLECTION).doc(id).set({
    ...data,
    createdAt: now,
    updatedAt: now,
  })
  return id
}

export async function updateWantBasketDoc(
  id: string,
  updates: Record<string, unknown>
): Promise<void> {
  const db = getAdminFirestore()
  await db
    .collection(COLLECTION)
    .doc(id)
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
}

export async function deleteWantBasketDoc(id: string): Promise<void> {
  const db = getAdminFirestore()
  await db.collection(COLLECTION).doc(id).delete()
}
