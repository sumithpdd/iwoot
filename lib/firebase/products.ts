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
  Timestamp,
} from "firebase/firestore"
import { db, isFirebaseInitialized } from "./config"
import { Product, WantProduct, HaveProduct, ProductType } from "@/lib/types/product"

const PRODUCTS_COLLECTION = "products"

export async function getProducts(userId: string, type?: ProductType): Promise<Product[]> {
  console.log("[getProducts] Starting - userId:", userId, "type:", type)
  
  try {
    // Check initialization
    const isInitialized = isFirebaseInitialized()
    console.log("[getProducts] Firebase initialized:", isInitialized, "db exists:", !!db)
    
    if (!isInitialized || !db) {
      const errorMsg = "Firestore database not initialized. Please check your Firebase configuration."
      console.error("[getProducts]", errorMsg)
      console.error("[getProducts] Config check:", {
        hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        windowExists: typeof window !== "undefined"
      })
      throw new Error(errorMsg)
    }

    console.log("[getProducts] Building query...")
    // Start with simple query without orderBy to avoid index issues
    let q = query(
      collection(db, PRODUCTS_COLLECTION),
      where("userId", "==", userId)
    )

    if (type) {
      q = query(q, where("type", "==", type))
    }

    console.log("[getProducts] Executing Firestore query...")
    const startTime = Date.now()
    
    const snapshot = await getDocs(q)
    
    const queryTime = Date.now() - startTime
    console.log(`[getProducts] Query completed in ${queryTime}ms, found ${snapshot.docs.length} documents`)

    const products = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
      } as Product
    })
    
    // Sort manually by createdAt (newest first)
    const sortedProducts = products.sort((a, b) => {
      const aDate = a.createdAt || ""
      const bDate = b.createdAt || ""
      if (!aDate && !bDate) return 0
      if (!aDate) return 1
      if (!bDate) return -1
      return bDate.localeCompare(aDate)
    })

    console.log("[getProducts] Products loaded successfully:", sortedProducts.length)
    return sortedProducts
  } catch (error: any) {
    console.error("[getProducts] Error caught:", error)
    console.error("[getProducts] Error details:", {
      name: error?.name,
      code: error?.code,
      message: error?.message,
      stack: error?.stack?.substring(0, 200)
    })
    
    // Return empty array instead of throwing to prevent UI from hanging
    if (error?.code === "failed-precondition" || error?.code === "unavailable" || error?.code === "permission-denied") {
      console.warn("[getProducts] Firestore query failed, returning empty array. Error code:", error.code)
      return []
    }
    
    // For other errors, still return empty array to prevent hanging
    console.warn("[getProducts] Returning empty array due to error")
    return []
  }
}

export async function getProduct(productId: string): Promise<Product | null> {
  try {
    if (!isFirebaseInitialized() || !db) {
      throw new Error("Firestore database not initialized. Please check your Firebase configuration.")
    }
    const docRef = doc(db, PRODUCTS_COLLECTION, productId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Product
    }
    return null
  } catch (error) {
    console.error("Error fetching product:", error)
    throw error
  }
}

export async function createProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    if (!isFirebaseInitialized() || !db) {
      throw new Error("Firestore database not initialized. Please check your Firebase configuration.")
    }

    const now = new Date().toISOString()
    const productData = {
      ...product,
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), productData)
    return docRef.id
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, "id" | "userId" | "createdAt">>
): Promise<void> {
  if (!isFirebaseInitialized() || !db) {
    throw new Error("Firestore database not initialized. Please check your Firebase configuration.")
  }
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    if (!isFirebaseInitialized() || !db) {
      throw new Error("Firestore database not initialized. Please check your Firebase configuration.")
    }
    const docRef = doc(db, PRODUCTS_COLLECTION, productId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

export async function addPriceHistory(
  productId: string,
  price: number,
  website: string
): Promise<void> {
  try {
    const product = await getProduct(productId)
    if (!product) throw new Error("Product not found")

    const priceHistory = product.priceHistory || []
    const newEntry = {
      price,
      date: new Date().toISOString(),
      website,
    }

    await updateProduct(productId, {
      priceHistory: [...priceHistory, newEntry],
      ...(product.type === "want" && { currentPrice: price }),
    })
  } catch (error) {
    console.error("Error adding price history:", error)
    throw error
  }
}

