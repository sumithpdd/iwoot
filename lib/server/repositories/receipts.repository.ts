import admin from "firebase-admin"
import { getAdminFirestore } from "@/lib/server/firebase-admin"
import { Receipt } from "@/lib/types/receipt"

const COLLECTION = "receipts"

export async function listReceiptsByUser(userId: string): Promise<Receipt[]> {
  const db = getAdminFirestore()
  const snapshot = await db
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .get()

  const receipts = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Receipt[]

  return receipts.sort((a, b) => {
    const aDate = a.receiptDate || ""
    const bDate = b.receiptDate || ""
    if (!aDate && !bDate) return 0
    if (!aDate) return 1
    if (!bDate) return -1
    return bDate.localeCompare(aDate)
  })
}

export async function getReceiptById(receiptId: string): Promise<Receipt | null> {
  const db = getAdminFirestore()
  const snap = await db.collection(COLLECTION).doc(receiptId).get()
  if (!snap.exists) return null
  return { id: snap.id, ...snap.data() } as Receipt
}

export async function createReceiptDoc(
  data: Omit<Receipt, "id" | "createdAt" | "updatedAt">
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

export async function updateReceiptDoc(
  receiptId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const db = getAdminFirestore()
  const payload: Record<string, unknown> = { ...updates }
  if (payload.storeId === null || payload.storeId === "") {
    payload.storeId = admin.firestore.FieldValue.delete()
  }
  await db
    .collection(COLLECTION)
    .doc(receiptId)
    .update({
      ...payload,
      updatedAt: new Date().toISOString(),
    })
}

export async function deleteReceiptDoc(receiptId: string): Promise<void> {
  const db = getAdminFirestore()
  await db.collection(COLLECTION).doc(receiptId).delete()
}

export async function listReceiptsByProductForUser(
  userId: string,
  productId: string
): Promise<Receipt[]> {
  const all = await listReceiptsByUser(userId)
  return all.filter((receipt) =>
    receipt.items?.some((item) => item.productId === productId)
  )
}
