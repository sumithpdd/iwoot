/**
 * Store profiles — secured REST APIs only.
 */

import { Store } from "@/lib/types/store"
import { apiRequest } from "@/lib/api/http"
import { validateStore, validateStoreUpdate } from "@/lib/validators/store.validator"
import { SUGGESTED_RETAIL_STORES } from "@/lib/data/suggested-retail-stores"

export class StoreService {
  static async getStores(getToken: () => Promise<string | null>): Promise<Store[]> {
    try {
      return await apiRequest<Store[]>(getToken, "/api/stores")
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to load stores: ${msg}`)
    }
  }

  static async getStore(
    getToken: () => Promise<string | null>,
    storeId: string
  ): Promise<Store | null> {
    if (!storeId) throw new Error("storeId is required")
    try {
      return await apiRequest<Store>(getToken, `/api/stores/${encodeURIComponent(storeId)}`)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) return null
      throw new Error(`Failed to load store: ${msg}`)
    }
  }

  static async createStore(
    getToken: () => Promise<string | null>,
    data: Omit<Store, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const v = validateStore(data)
    if (!v.valid) throw new Error(v.errors.join(", "))
    const res = await apiRequest<{ id: string }>(getToken, "/api/stores", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return res.id
  }

  static async updateStore(
    getToken: () => Promise<string | null>,
    storeId: string,
    updates: Partial<Omit<Store, "id" | "userId" | "createdAt">>
  ): Promise<void> {
    const v = validateStoreUpdate(updates)
    if (!v.valid) throw new Error(v.errors.join(", "))
    await apiRequest(getToken, `/api/stores/${encodeURIComponent(storeId)}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    })
  }

  static async deleteStore(
    getToken: () => Promise<string | null>,
    storeId: string
  ): Promise<void> {
    await apiRequest(getToken, `/api/stores/${encodeURIComponent(storeId)}`, {
      method: "DELETE",
    })
  }

  /**
   * Creates suggested retailer rows (Amazon, Joybuy, eBay, …) that are not already
   * present by name (case-insensitive). Returns how many were created.
   */
  static async seedSuggestedRetailers(
    getToken: () => Promise<string | null>,
    userId: string,
    existing: Store[]
  ): Promise<number> {
    const taken = new Set(existing.map((s) => s.name.trim().toLowerCase()))
    let added = 0
    for (const row of SUGGESTED_RETAIL_STORES) {
      const key = row.name.trim().toLowerCase()
      if (taken.has(key)) continue
      const payload: Omit<Store, "id" | "createdAt" | "updatedAt"> = {
        userId,
        name: row.name.trim(),
        website: row.website?.trim() || undefined,
        notes: row.notes?.trim() || undefined,
      }
      const v = validateStore(payload)
      if (!v.valid) continue
      try {
        await StoreService.createStore(getToken, payload)
        taken.add(key)
        added++
      } catch {
        // skip duplicates / network errors per row
      }
    }
    return added
  }
}
