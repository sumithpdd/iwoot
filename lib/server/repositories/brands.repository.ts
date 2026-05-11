import { getAdminFirestore } from "@/lib/server/firebase-admin"
import type { Brand } from "@/lib/types/brand"

const COLLECTION = "brands"

export async function listBrandsByUser(userId: string): Promise<Brand[]> {
  const db = getAdminFirestore()
  const snapshot = await db.collection(COLLECTION).where("userId", "==", userId).get()
  const brands = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Brand[]
  return brands.sort((a, b) => (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase()))
}

export async function getBrandById(brandId: string): Promise<Brand | null> {
  const db = getAdminFirestore()
  const snap = await db.collection(COLLECTION).doc(brandId).get()
  if (!snap.exists) return null
  return { id: snap.id, ...snap.data() } as Brand
}

export async function createBrandDoc(
  data: Omit<Brand, "id" | "createdAt" | "updatedAt">
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

export async function updateBrandDoc(brandId: string, updates: Record<string, unknown>): Promise<void> {
  const db = getAdminFirestore()
  await db
    .collection(COLLECTION)
    .doc(brandId)
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
}

export async function deleteBrandDoc(brandId: string): Promise<void> {
  const db = getAdminFirestore()
  await db.collection(COLLECTION).doc(brandId).delete()
}

export async function findBrandByNameForUser(
  userId: string,
  name: string
): Promise<Brand | null> {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return null
  const list = await listBrandsByUser(userId)
  return list.find((b) => b.name.trim().toLowerCase() === normalized) ?? null
}
