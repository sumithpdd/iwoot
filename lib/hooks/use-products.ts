/**
 * Custom Hook for Product Operations
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

  const getToken = useCallback(
    () => user?.getIdToken() ?? Promise.resolve(null),
    [user]
  )

  const loadProducts = useCallback(async (type?: ProductType) => {
    if (!user) {
      setError("User not authenticated")
      return
    }

    setLoading(true)
    setError(null)
    setLastType(type)

    try {
      const data = await ProductService.getProducts(getToken, type)
      setProducts(data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load products"
      setError(errorMessage)
      console.error("[useProducts] Error loading products:", err)
    } finally {
      setLoading(false)
    }
  }, [user, getToken])

  const createProduct = useCallback(async (
    product: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<string> => {
    if (!user) {
      throw new Error("User not authenticated")
    }

    try {
      const productId = await ProductService.createProduct(getToken, {
        ...product,
        userId: user.uid,
      })
      await loadProducts(lastType)
      return productId
    } catch (err: unknown) {
      console.error("[useProducts] Error creating product:", err)
      throw err
    }
  }, [user, getToken, loadProducts, lastType])

  const updateProduct = useCallback(async (
    productId: string,
    updates: Partial<Omit<Product, "id" | "userId" | "createdAt">>
  ): Promise<void> => {
    try {
      await ProductService.updateProduct(getToken, productId, updates)
      await loadProducts(lastType)
    } catch (err: unknown) {
      console.error("[useProducts] Error updating product:", err)
      throw err
    }
  }, [getToken, loadProducts, lastType])

  const deleteProduct = useCallback(async (productId: string): Promise<void> => {
    try {
      await ProductService.deleteProduct(getToken, productId)
      await loadProducts(lastType)
    } catch (err: unknown) {
      console.error("[useProducts] Error deleting product:", err)
      throw err
    }
  }, [getToken, loadProducts, lastType])

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
