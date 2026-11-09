/**
 * Product form AI assist — posts to /api/ai/product-assist.
 */

import { apiRequest } from "@/lib/api/http"
import type { ProductType } from "@/lib/types/product"

export type ProductAssistInput = {
  prompt: string
  field: string
  productType: ProductType
  currentValues: Record<string, unknown>
}

export type ProductAssistResult = {
  fields: Record<string, unknown>
}

export class AiProductAssistService {
  static async suggestFields(
    getToken: () => Promise<string | null>,
    input: ProductAssistInput
  ): Promise<ProductAssistResult> {
    if (!input.prompt?.trim()) throw new Error("prompt is required")
    const res = await apiRequest<{ fields?: Record<string, unknown> }>(
      getToken,
      "/api/ai/product-assist",
      {
        method: "POST",
        body: JSON.stringify({
          prompt: input.prompt.trim(),
          field: input.field,
          productType: input.productType,
          currentValues: input.currentValues,
        }),
      }
    )
    return { fields: res.fields ?? {} }
  }
}
