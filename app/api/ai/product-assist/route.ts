import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import {
  getUidFromRequest,
  unauthorized,
  badRequest,
} from "@/lib/server/require-auth"
import { gatherCatalogHints } from "@/lib/catalog/gather-catalog-hints"
import { getGeminiModelId } from "@/lib/server/gemini-model"

export const runtime = "nodejs"

const GROUNDING_KEYS = [
  "name",
  "brand",
  "model",
  "sku",
  "category",
  "website",
  "color",
  "size",
  "description",
  "notes",
  "originalPrice",
  "currentPrice",
  "priceBought",
  "targetPrice",
  "date",
  "purchaseLocation",
  "condition",
  "warrantyExpiry",
  "listingStatus",
  "listingPlatforms",
  "soldAt",
  "soldWhere",
] as const

function pickGrounding(current: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of GROUNDING_KEYS) {
    if (current[k] !== undefined && current[k] !== "") {
      out[k] = current[k]
    }
  }
  return out
}

export async function POST(request: Request) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  let body: {
    prompt?: string
    field?: string
    productType?: "want" | "have"
    currentValues?: Record<string, unknown>
  }
  try {
    body = await request.json()
  } catch {
    return badRequest("Invalid JSON body")
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""
  if (!prompt) {
    return badRequest("prompt is required")
  }

  const productType = body.productType === "have" ? "have" : "want"
  const field = typeof body.field === "string" ? body.field : ""
  const current = body.currentValues ?? {}
  const grounding = pickGrounding(current)

  const { summaryForPrompt } = await gatherCatalogHints(current)

  const modelId = getGeminiModelId()

  try {
    const { text } = await generateText({
      model: google(modelId),
      prompt: `You help fill out a personal product tracker form (IWOOT).

Product list type: "${productType}"
- "want" = wishlist / price tracking
- "have" = items already owned

## Ground truth (must stay consistent — do NOT invent a different product)
These fields are already on the form. Use **name, brand, model, and SKU/part number** as the primary identity. Every suggestion must describe THIS product (or this exact product line). If the user instruction conflicts with these identifiers, prefer the identifiers and treat the instruction as extra context only.
${JSON.stringify(grounding, null, 2)}

## Optional focus field
The user opened assist from field: "${field || "none"}". If set, prioritise improving that field while still filling other gaps when helpful.

## External catalogue hints (auto-fetched — verify, may be incomplete or wrong locale)
Sources may include **UPCitemdb** (consumer goods / barcode) and **Open Food Facts** (food & packaged goods with barcode). Cross-check against name/brand/model/SKU. Do not copy a wrong category if the product is clearly not food.
${summaryForPrompt}

## User instruction (plain language)
${prompt}

## Response format
Respond with ONLY valid JSON (no markdown code fences). Shape:
{"fields":{"name":"string optional","brand":"string optional","website":"string optional URL","originalPrice":number,"description":"string optional","category":"string optional","model":"string optional","sku":"string optional","color":"string optional","size":"string optional","notes":"string optional","targetPrice":number,"currentPrice":number,"priceBought":number,"purchaseLocation":"string","condition":"string","listingPlatforms":["string marketplace names"]}}

Include only keys you can support with evidence from ground truth, catalogue hints, or the user instruction. Omit unknown keys. For **description**, weave together name, brand, model, SKU, category, and catalogue text when relevant. Use a plausible retail **website** URL only when reasonably certain. For **listingPlatforms**, only when productType is "have" and the user asks about resale — use a short array of marketplace names (e.g. Gumtree, eBay).`,
    })

    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/i, "")
      .trim()
    const parsed = JSON.parse(cleaned) as { fields?: Record<string, unknown> }
    const fields =
      parsed.fields && typeof parsed.fields === "object" ? parsed.fields : {}

    return Response.json({ fields })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Generation failed"
    return badRequest(msg)
  }
}
