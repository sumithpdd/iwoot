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

App purpose: help the signed-in user track products they WANT or HAVE, record purchase prices, compare resale venues (Gumtree, CeX / webuy, Shpock), and draft listing copy.

Rules:
- Prefer tools (list_inventory, get_sell_compare, draft_listing) over inventing stock or prices.
- Ownership answers must use USER INVENTORY / list_inventory. Never substitute Move 2 for original Sonos Move (S17), or invent a Nebula model they do not own.
- Sell-compare pages are static UK reference grids, not live scrapes. Say so when quoting prices.
- Keep answers practical and brief unless asked for detail.
- When helping sell Sonos Move or Nebula Cosmos Max, point to /sell-compare/sonos-move and /sell-compare/nebula-cosmos-max.

${inventory}`,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(6),
    })

    return result.toUIMessageStreamResponse()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Chat failed"
    return badRequest(msg)
  }
}
