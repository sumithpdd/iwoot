import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore"
import { db, isFirebaseInitialized } from "./config"
import { Receipt, ReceiptItem } from "@/lib/types/receipt"

const RECEIPTS_COLLECTION = "receipts"

export async function getReceipts(userId: string): Promise<Receipt[]> {
  try {
    if (!isFirebaseInitialized() || !db) {
      throw new Error("Firestore database not initialized. Please check your Firebase configuration.")
    }

    // Query without orderBy first to avoid index issues
    let q = query(
      collection(db, RECEIPTS_COLLECTION),
      where("userId", "==", userId)
    )

    const snapshot = await getDocs(q)
    const receipts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Receipt[]
    
    // Sort manually by receiptDate
    return receipts.sort((a, b) => {
      const aDate = a.receiptDate || ""
      const bDate = b.receiptDate || ""
      if (!aDate && !bDate) return 0
      if (!aDate) return 1
      if (!bDate) return -1
      return bDate.localeCompare(aDate)
    })
  } catch (error: any) {
    console.error("Error fetching receipts:", error)
    // Return empty array instead of throwing
    if (error.code === "failed-precondition" || error.code === "unavailable") {
      console.warn("Firestore query failed, returning empty array")
      return []
    }
    throw error
  }
}

export async function getReceipt(receiptId: string): Promise<Receipt | null> {
  try {
    if (!isFirebaseInitialized() || !db) {
      throw new Error("Firestore database not initialized. Please check your Firebase configuration.")
    }

    const docRef = doc(db, RECEIPTS_COLLECTION, receiptId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Receipt
    }
    return null
  } catch (error) {
    console.error("Error fetching receipt:", error)
    throw error
  }
}

export async function createReceipt(receipt: Omit<Receipt, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    if (!isFirebaseInitialized() || !db) {
      throw new Error("Firestore database not initialized. Please check your Firebase configuration.")
    }

    const now = new Date().toISOString()
    const receiptData = {
      ...receipt,
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await addDoc(collection(db, RECEIPTS_COLLECTION), receiptData)
    return docRef.id
  } catch (error) {
    console.error("Error creating receipt:", error)
    throw error
  }
}

export async function updateReceipt(
  receiptId: string,
  updates: Partial<Omit<Receipt, "id" | "userId" | "createdAt">>
): Promise<void> {
  try {
    if (!isFirebaseInitialized() || !db) {
      throw new Error("Firestore database not initialized. Please check your Firebase configuration.")
    }

    const docRef = doc(db, RECEIPTS_COLLECTION, receiptId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error updating receipt:", error)
    throw error
  }
}

export async function deleteReceipt(receiptId: string): Promise<void> {
  try {
    if (!isFirebaseInitialized() || !db) {
      throw new Error("Firestore database not initialized. Please check your Firebase configuration.")
    }

    const docRef = doc(db, RECEIPTS_COLLECTION, receiptId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting receipt:", error)
    throw error
  }
}

export async function getReceiptsByProduct(productId: string): Promise<Receipt[]> {
  try {
    if (!isFirebaseInitialized() || !db) {
      throw new Error("Firestore database not initialized. Please check your Firebase configuration.")
    }

    const q = query(
      collection(db, RECEIPTS_COLLECTION),
      where("items", "array-contains-any", [{ productId }])
    )

    const snapshot = await getDocs(q)
    const receipts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Receipt[]
    
    return receipts.filter((receipt) =>
      receipt.items?.some((item: ReceiptItem) => item.productId === productId) ?? false
    )
  } catch (error) {
    console.error("Error fetching receipts by product:", error)
    // Return empty array if query fails (might need index)
    return []
  }
}

