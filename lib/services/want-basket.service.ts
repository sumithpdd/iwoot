/**
 * Want baskets — multi-item shopping plans via API.
 */

import { apiRequest } from "@/lib/api/http"
import type { WantBasket } from "@/lib/types/want-basket"
import type { BuyingStage } from "@/lib/types/want-research"

export type WantBasketWriteInput = {
  title: string
  blurb?: string
  buyingStage?: BuyingStage
  targetTotalGbp?: number | null
  currencyNote?: string
  researchSummary?: string
}

export class WantBasketService {
  static async list(
    getToken: () => Promise<string | null>
  ): Promise<WantBasket[]> {
    return apiRequest<WantBasket[]>(getToken, "/api/want-baskets")
  }

  static async get(
    getToken: () => Promise<string | null>,
    basketId: string
  ): Promise<WantBasket | null> {
    try {
      return await apiRequest<WantBasket>(
        getToken,
        `/api/want-baskets/${encodeURIComponent(basketId)}`
      )
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        return null
      }
      throw e
    }
  }

  static async create(
    getToken: () => Promise<string | null>,
    data: WantBasketWriteInput
  ): Promise<string> {
    if (!data.title?.trim()) throw new Error("title is required")
    const res = await apiRequest<{ id: string }>(getToken, "/api/want-baskets", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return res.id
  }

  static async update(
    getToken: () => Promise<string | null>,
    basketId: string,
    data: Partial<WantBasketWriteInput>
  ): Promise<void> {
    await apiRequest(getToken, `/api/want-baskets/${encodeURIComponent(basketId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  static async delete(
    getToken: () => Promise<string | null>,
    basketId: string
  ): Promise<void> {
    await apiRequest(getToken, `/api/want-baskets/${encodeURIComponent(basketId)}`, {
      method: "DELETE",
    })
  }
}
