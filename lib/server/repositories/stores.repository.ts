import { getAdminFirestore } from "@/lib/server/firebase-admin"
import { Store } from "@/lib/types/store"

const COLLECTION = "stores"

export async function listStoresByUser(userId: string): Promise<Store[]> {
  const db = getAdminFirestore()
  const snapshot = await db.collection(COLLECTION).where("userId", "==", userId).get()
  const stores = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Store[]

  return stores.sort((a, b) => {
    const an = (a.name || "").toLowerCase()
    const bn = (b.name || "").toLowerCase()
    return an.localeCompare(bn)
  })
}

export async function getStoreById(storeId: string): Promise<Store | null> {
  const db = getAdminFirestore()
  const snap = await db.collection(COLLECTION).doc(storeId).get()
  if (!snap.exists) return null
  return { id: snap.id, ...snap.data() } as Store
}

export async function createStoreDoc(
  data: Omit<Store, "id" | "createdAt" | "updatedAt">
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

export async function updateStoreDoc(
  storeId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const db = getAdminFirestore()
  await db
    .collection(COLLECTION)
    .doc(storeId)
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
}

export async function deleteStoreDoc(storeId: string): Promise<void> {
  const db = getAdminFirestore()
  await db.collection(COLLECTION).doc(storeId).delete()
}

export async function findStoreByNameForUser(
  userId: string,
  name: string
): Promise<Store | null> {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return null
  const list = await listStoresByUser(userId)
  return list.find((s) => s.name.trim().toLowerCase() === normalized) ?? null
}

export async function assertStoreOwnedByUser(
  storeId: string,
  userId: string
): Promise<Store> {
  const store = await getStoreById(storeId)
  if (!store) throw new Error("Store not found")
  if (store.userId !== userId) throw new Error("Forbidden")
  return store
}
