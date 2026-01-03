/**
 * Custom Hook for Product Operations
 * 
 * Design Pattern: Custom Hooks Pattern
 * - Encapsulates product-related state and operations
 * - Provides a clean API for components
 * - Handles loading and error states
 */

import { useState, useCallback } from "react"
import { Product, ProductType } from "@/lib/types/product"
import { ProductService } from "@/lib/services/product.service"
import { useAuth } from "@/lib/auth-context"

interface UseProductsReturn {
  products: Product[]
  loading: boolean
  error: string | null
  loadProducts: (type?: ProductType) => Promise<void>
  createProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<string>
  updateProduct: (productId: string, updates: Partial<Omit<Product, "id" | "userId" | "createdAt">>) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  refreshProducts: () => Promise<void>
}

export function useProducts(): UseProductsReturn {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastType, setLastType] = useState<ProductType | undefined>(undefined)

  const loadProducts = useCallback(async (type?: ProductType) => {
    if (!user) {
      setError("User not authenticated")
      return
    }

    setLoading(true)
    setError(null)
    setLastType(type)

    try {
      const data = await ProductService.getProducts(user.uid, type)
      setProducts(data)
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load products"
      setError(errorMessage)
      console.error("[useProducts] Error loading products:", err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const createProduct = useCallback(async (
    product: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<string> => {
    if (!user) {
      throw new Error("User not authenticated")
    }

    try {
      const productId = await ProductService.createProduct({
        ...product,
        userId: user.uid,
      })
      // Reload products to include the new one
      await loadProducts(lastType)
      return productId
    } catch (err: any) {
      console.error("[useProducts] Error creating product:", err)
      throw err
    }
  }, [user, loadProducts, lastType])

  const updateProduct = useCallback(async (
    productId: string,
    updates: Partial<Omit<Product, "id" | "userId" | "createdAt">>
  ): Promise<void> => {
    try {
      await ProductService.updateProduct(productId, updates)
      // Reload products to reflect changes
      await loadProducts(lastType)
    } catch (err: any) {
      console.error("[useProducts] Error updating product:", err)
      throw err
    }
  }, [loadProducts, lastType])

  const deleteProduct = useCallback(async (productId: string): Promise<void> => {
    try {
      await ProductService.deleteProduct(productId)
      // Reload products to reflect deletion
      await loadProducts(lastType)
    } catch (err: any) {
      console.error("[useProducts] Error deleting product:", err)
      throw err
    }
  }, [loadProducts, lastType])

  const refreshProducts = useCallback(async () => {
    await loadProducts(lastType)
  }, [loadProducts, lastType])

  return {
    products,
    loading,
    error,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    refreshProducts,
  }
}

