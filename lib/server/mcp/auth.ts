import { timingSafeEqual } from "node:crypto"
import { getUidFromRequest } from "@/lib/server/require-auth"

function sameToken(provided: string, expected: string): boolean {
  const left = Buffer.from(provided)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function presentedToken(header: string): string {
  let value = header.trim()
  while (/^bearer\s+/i.test(value)) {
    value = value.replace(/^bearer\s+/i, "")
  }
  return value.trim()
}

function credential(request: Request): string {
  const apiKey = request.headers.get("x-api-key")?.trim() ?? ""
  if (apiKey) return apiKey
  return presentedToken(request.headers.get("authorization") ?? "")
}

export type McpAuthOk = { uid: string }
export type McpAuthFail = { response: Response }

/**
 * Resolve the user for MCP:
 * 1) Firebase ID token (Authorization: Bearer <idToken>) → that uid
 * 2) Shared IWOOT_MCP_TOKEN + IWOOT_MCP_USER_ID (for Claude / ChatGPT connectors)
 */
export async function authorizeIwootMcp(
  request: Request
): Promise<McpAuthOk | McpAuthFail> {
  const provided = credential(request)
  if (!provided) {
    return {
      response: Response.json(
        { error: "Missing Authorization Bearer token or x-api-key" },
        { status: 401 }
      ),
    }
  }

  const shared = process.env.IWOOT_MCP_TOKEN?.trim()
  const sharedUid = process.env.IWOOT_MCP_USER_ID?.trim()
  if (shared && sharedUid && sameToken(provided, shared)) {
    return { uid: sharedUid }
  }

  const uid = await getUidFromRequest(
    new Request(request.url, {
      headers: { Authorization: `Bearer ${provided}` },
    })
  )
  if (uid) return { uid }

  return {
    response: Response.json({ error: "Invalid API key or Firebase token" }, { status: 401 }),
  }
}
