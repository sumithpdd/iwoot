import admin from "firebase-admin"
import { getAdminFirestore } from "@/lib/server/firebase-admin"
import { Product, ProductType } from "@/lib/types/product"

const COLLECTION = "products"

export async function listProductsByUser(
  userId: string,
  type?: ProductType
): Promise<Product[]> {
  const db = getAdminFirestore()
  const snapshot = type
    ? await db
        .collection(COLLECTION)
        .where("userId", "==", userId)
        .where("type", "==", type)
        .get()
    : await db.collection(COLLECTION).where("userId", "==", userId).get()
  const products = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Product[]

  return products.sort((a, b) => {
    const aDate = a.createdAt || ""
    const bDate = b.createdAt || ""
    if (!aDate && !bDate) return 0
    if (!aDate) return 1
    if (!bDate) return -1
    return bDate.localeCompare(aDate)
  })
}

export async function getProductById(productId: string): Promise<Product | null> {
  const db = getAdminFirestore()
  const snap = await db.collection(COLLECTION).doc(productId).get()
  if (!snap.exists) return null
  return { id: snap.id, ...snap.data() } as Product
}

export async function createProductDoc(
  data: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const db = getAdminFirestore()
  const now = new Date().toISOString()
  const docData = {
    ...data,
    createdAt: now,
    updatedAt: now,
  }
  const ref = await db.collection(COLLECTION).add(docData)
  return ref.id
}

/** Scalar product fields where JSON `null` means remove from the document (listing migration). */
const PRODUCT_NULL_DELETES = new Set([
  "isSelling",
  "sellingOn",
  "soldAt",
  "soldWhere",
])

export async function updateProductDoc(
  productId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const db = getAdminFirestore()
  const payload: Record<string, unknown> = { ...updates }
  if (payload.storeId === null || payload.storeId === "") {
    payload.storeId = admin.firestore.FieldValue.delete()
  }
  if (payload.brandId === null || payload.brandId === "") {
    payload.brandId = admin.firestore.FieldValue.delete()
  }
  for (const key of PRODUCT_NULL_DELETES) {
    if (key in payload && payload[key] === null) {
      payload[key] = admin.firestore.FieldValue.delete()
    }
  }
  await db
    .collection(COLLECTION)
    .doc(productId)
    .update({
      ...payload,
      updatedAt: new Date().toISOString(),
    })
}

export async function deleteProductDoc(productId: string): Promise<void> {
  const db = getAdminFirestore()
  await db.collection(COLLECTION).doc(productId).delete()
}

export async function addPriceHistoryEntry(
  productId: string,
  price: number,
  website: string,
  notes?: string
): Promise<void> {
  const product = await getProductById(productId)
  if (!product) throw new Error("Product not found")

  const priceHistory = product.priceHistory || []
  const newEntry = {
    price,
    date: new Date().toISOString(),
    website,
    ...(notes && { notes }),
  }

  const updates: Record<string, unknown> = {
    priceHistory: [...priceHistory, newEntry],
    updatedAt: new Date().toISOString(),
  }
  if (product.type === "want") {
    updates.currentPrice = price
  }

  await updateProductDoc(productId, updates)
}
