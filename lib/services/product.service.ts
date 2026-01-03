/**
 * Product Service Layer
 * 
 * This service layer provides a clean abstraction for product operations.
 * It handles business logic, validation, and error handling.
 * 
 * Design Pattern: Service Layer Pattern
 * - Separates business logic from UI components
 * - Provides a single source of truth for product operations
 * - Makes testing easier
 * - Improves code reusability
 */

import { Product, ProductType } from "@/lib/types/product"
import * as productRepository from "@/lib/firebase/products"
import { validateProduct, validateProductUpdate } from "@/lib/validators/product.validator"

export class ProductService {
  /**
   * Get all products for a user
   * @param userId - The user ID
   * @param type - Optional product type filter
   * @returns Array of products
   */
  static async getProducts(userId: string, type?: ProductType): Promise<Product[]> {
    if (!userId || typeof userId !== "string") {
      throw new Error("Valid userId is required")
    }

    try {
      return await productRepository.getProducts(userId, type)
    } catch (error: any) {
      console.error("[ProductService] Error fetching products:", error)
      throw new Error(`Failed to fetch products: ${error.message}`)
    }
  }

  /**
   * Get a single product by ID
   * @param productId - The product ID
   * @returns Product or null if not found
   */
  static async getProduct(productId: string): Promise<Product | null> {
    if (!productId || typeof productId !== "string") {
      throw new Error("Valid productId is required")
    }

    try {
      return await productRepository.getProduct(productId)
    } catch (error: any) {
      console.error("[ProductService] Error fetching product:", error)
      throw new Error(`Failed to fetch product: ${error.message}`)
    }
  }

  /**
   * Create a new product
   * @param productData - Product data (without id, createdAt, updatedAt)
   * @returns The created product ID
   */
  static async createProduct(
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    // Validate product data
    const validation = validateProduct(productData)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
    }

    try {
      return await productRepository.createProduct(productData)
    } catch (error: any) {
      console.error("[ProductService] Error creating product:", error)
      throw new Error(`Failed to create product: ${error.message}`)
    }
  }

  /**
   * Update an existing product
   * @param productId - The product ID
   * @param updates - Partial product data to update
   */
  static async updateProduct(
    productId: string,
    updates: Partial<Omit<Product, "id" | "userId" | "createdAt">>
  ): Promise<void> {
    if (!productId || typeof productId !== "string") {
      throw new Error("Valid productId is required")
    }

    // Validate updates
    const validation = validateProductUpdate(updates)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
    }

    try {
      await productRepository.updateProduct(productId, updates)
    } catch (error: any) {
      console.error("[ProductService] Error updating product:", error)
      throw new Error(`Failed to update product: ${error.message}`)
    }
  }

  /**
   * Delete a product
   * @param productId - The product ID
   */
  static async deleteProduct(productId: string): Promise<void> {
    if (!productId || typeof productId !== "string") {
      throw new Error("Valid productId is required")
    }

    try {
      await productRepository.deleteProduct(productId)
    } catch (error: any) {
      console.error("[ProductService] Error deleting product:", error)
      throw new Error(`Failed to delete product: ${error.message}`)
    }
  }

  /**
   * Add price history entry to a product
   * @param productId - The product ID
   * @param price - The price
   * @param date - The date (ISO string)
   * @param storeName - Optional store name
   * @param notes - Optional notes
   */
  static async addPriceHistory(
    productId: string,
    price: number,
    date: string,
    storeName?: string,
    notes?: string
  ): Promise<void> {
    if (!productId || typeof productId !== "string") {
      throw new Error("Valid productId is required")
    }

    if (price <= 0) {
      throw new Error("Price must be greater than 0")
    }

    try {
      await productRepository.addPriceHistory(productId, price, storeName || "Unknown Store")
    } catch (error: any) {
      console.error("[ProductService] Error adding price history:", error)
      throw new Error(`Failed to add price history: ${error.message}`)
    }
  }
}

