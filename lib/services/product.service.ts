/**
 * Product Service — calls secured REST APIs (Firestore via Firebase Admin only on server).
 */

import { Product, ProductType } from "@/lib/types/product"
import { apiRequest } from "@/lib/api/http"
import { validateProduct, validateProductUpdate } from "@/lib/validators/product.validator"

export class ProductService {
  static async getProducts(
    getToken: () => Promise<string | null>,
    type?: ProductType
  ): Promise<Product[]> {
    const qs =
      type === "want" || type === "have"
        ? `?type=${encodeURIComponent(type)}`
        : ""
    try {
      return await apiRequest<Product[]>(getToken, `/api/products${qs}`)
    } catch (error: unknown) {
      console.error("[ProductService] Error fetching products:", error)
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to fetch products: ${msg}`)
    }
  }

  static async getProduct(
    getToken: () => Promise<string | null>,
    productId: string
  ): Promise<Product | null> {
    if (!productId) throw new Error("Valid productId is required")
    try {
      return await apiRequest<Product>(getToken, `/api/products/${productId}`)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        return null
      }
      console.error("[ProductService] Error fetching product:", error)
      throw new Error(`Failed to fetch product: ${msg}`)
    }
  }

  static async createProduct(
    getToken: () => Promise<string | null>,
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const validation = validateProduct(productData)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
    }

    try {
      const res = await apiRequest<{ id: string }>(getToken, "/api/products", {
        method: "POST",
        body: JSON.stringify(productData),
      })
      return res.id
    } catch (error: unknown) {
      console.error("[ProductService] Error creating product:", error)
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to create product: ${msg}`)
    }
  }

  static async updateProduct(
    getToken: () => Promise<string | null>,
    productId: string,
    updates: Partial<Omit<Product, "id" | "userId" | "createdAt">>
  ): Promise<void> {
    if (!productId) throw new Error("Valid productId is required")

    const validation = validateProductUpdate(updates)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
    }

    try {
      await apiRequest(getToken, `/api/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      })
    } catch (error: unknown) {
      console.error("[ProductService] Error updating product:", error)
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to update product: ${msg}`)
    }
  }

  static async deleteProduct(
    getToken: () => Promise<string | null>,
    productId: string
  ): Promise<void> {
    if (!productId) throw new Error("Valid productId is required")

    try {
      await apiRequest(getToken, `/api/products/${productId}`, {
        method: "DELETE",
      })
    } catch (error: unknown) {
      console.error("[ProductService] Error deleting product:", error)
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to delete product: ${msg}`)
    }
  }

  static async addPriceHistory(
    getToken: () => Promise<string | null>,
    productId: string,
    price: number,
    _date: string,
    storeName?: string,
    notes?: string
  ): Promise<void> {
    if (!productId) throw new Error("Valid productId is required")
    if (price <= 0) throw new Error("Price must be greater than 0")

    try {
      await apiRequest(getToken, `/api/products/${productId}/price-history`, {
        method: "POST",
        body: JSON.stringify({
          price,
          website: storeName || "Unknown Store",
          notes,
        }),
      })
    } catch (error: unknown) {
      console.error("[ProductService] Error adding price history:", error)
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to add price history: ${msg}`)
    }
  }
}
