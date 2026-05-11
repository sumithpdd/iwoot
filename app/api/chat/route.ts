import { convertToModelMessages, streamText, type UIMessage } from "ai"
import { google } from "@ai-sdk/google"
import {
  getUidFromRequest,
  unauthorized,
  badRequest,
} from "@/lib/server/require-auth"

export const runtime = "nodejs"

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

  const modelId =
    process.env.GEMINI_MODEL ||
    process.env.GOOGLE_GENERATIVE_AI_MODEL ||
    "gemini-2.5-flash"

  try {
    const modelMessages = await convertToModelMessages(messages)

    const result = streamText({
      model: google(modelId),
      system: `You are a helpful assistant for IWOOT (I Want One Of Those / I Have One Of Those), a personal product price tracker. The user is signed in. Help them describe products, interpret deals, suggest realistic placeholder URLs if unknown, and draft concise notes or specs. Keep answers practical and brief unless asked for detail.`,
      messages: modelMessages,
    })

    return result.toUIMessageStreamResponse()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Chat failed"
    return badRequest(msg)
  }
}
