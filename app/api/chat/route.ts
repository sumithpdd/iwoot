import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai"
import { google } from "@ai-sdk/google"
import {
  getUidFromRequest,
  unauthorized,
  badRequest,
} from "@/lib/server/require-auth"
import { getGeminiModelId } from "@/lib/server/gemini-model"
import { buildUserInventoryContext } from "@/lib/server/chat-user-inventory"
import { buildInventoryChatTools } from "@/lib/server/ai/inventory-tools"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  let body: { messages?: UIMessage[] }
  try {
    body = await request.json()
  } catch {
    return badRequest("Invalid JSON body")
  }

  const messages = body.messages
  if (!messages?.length) {
    return badRequest("messages are required")
  }

  const modelId = getGeminiModelId()

  let inventory =
    "USER INVENTORY: unavailable this request. If asked what they own, say you could not load their tracker and ask them to retry."
  try {
    inventory = await buildUserInventoryContext(uid)
  } catch (e: unknown) {
    console.warn(
      "[chat] inventory load failed:",
      e instanceof Error ? e.message : e
    )
  }

  try {
    const modelMessages = await convertToModelMessages(messages)
    const tools = buildInventoryChatTools(uid)

    const result = streamText({
      model: google(modelId),
      system: `You are the IWOOT assistant (I Want One Of Those / I Have One Of Those).

App purpose:
- WANT: track products the user is researching (store visits, UK/US price benchmarks, links, buying plans, multi-item baskets).
- HAVE: track owned items, sell on Gumtree/Shpock/eBay/CeX, mark sold/gifted/recycled.

Rules:
- Prefer tools over inventing inventory or prices. Use list_want_research / get_want_details for buying research; list_inventory for ownership.
- Never invent products they do not have. Never substitute Move 2 for original Sonos Move (S17).
- When the user shares research (stores visited, Apple UK prices, buying plan), call upsert_want_basket / upsert_want_product / add_research_visit / add_price_benchmark / set_buying_plan_steps.
- When they buy something, convert_want_to_have. When they list it, record_live_listing or draft_listing. When done with it, update_have_disposition (sold/gifted/recycled).
- Sell-compare pages are UK resale reference grids, not live scrapes.
- Keep answers practical and brief unless asked for detail.

${inventory}`,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(10),
    })

    return result.toUIMessageStreamResponse()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Chat failed"
    return badRequest(msg)
  }
}
