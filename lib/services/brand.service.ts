import type { Brand } from "@/lib/types/brand"
import { apiRequest } from "@/lib/api/http"
import { validateBrand, validateBrandUpdate } from "@/lib/validators/brand.validator"

export class BrandService {
  static async getBrands(getToken: () => Promise<string | null>): Promise<Brand[]> {
    try {
      return await apiRequest<Brand[]>(getToken, "/api/brands")
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to load brands: ${msg}`)
    }
  }

  static async getBrand(
    getToken: () => Promise<string | null>,
    brandId: string
  ): Promise<Brand | null> {
    if (!brandId) throw new Error("brandId is required")
    try {
      return await apiRequest<Brand>(getToken, `/api/brands/${encodeURIComponent(brandId)}`)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) return null
      throw new Error(`Failed to load brand: ${msg}`)
    }
  }

  static async createBrand(
    getToken: () => Promise<string | null>,
    data: Omit<Brand, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const v = validateBrand(data)
    if (!v.valid) throw new Error(v.errors.join(", "))
    const res = await apiRequest<{ id: string }>(getToken, "/api/brands", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return res.id
  }

  static async updateBrand(
    getToken: () => Promise<string | null>,
    brandId: string,
    updates: Partial<Omit<Brand, "id" | "userId" | "createdAt">>
  ): Promise<void> {
    const v = validateBrandUpdate(updates)
    if (!v.valid) throw new Error(v.errors.join(", "))
    await apiRequest(getToken, `/api/brands/${encodeURIComponent(brandId)}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    })
  }

  static async deleteBrand(
    getToken: () => Promise<string | null>,
    brandId: string
  ): Promise<void> {
    await apiRequest(getToken, `/api/brands/${encodeURIComponent(brandId)}`, {
      method: "DELETE",
    })
  }
}
