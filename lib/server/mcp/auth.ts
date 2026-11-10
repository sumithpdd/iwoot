import { timingSafeEqual } from "node:crypto"
import { getUidFromRequest } from "@/lib/server/require-auth"
import {
  resolveMcpAccessToken,
  type McpTokenScope,
} from "@/lib/server/mcp/access-tokens"
import {
  oauthProtectedResourceMetadataUrl,
  publicOriginFromRequest,
} from "@/lib/server/mcp/public-origin"

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

export type McpAuthOk = { uid: string; scopes: McpTokenScope[] }
export type McpAuthFail = { response: Response }

function unauthorizedChallenge(request: Request, message: string): Response {
  const origin = publicOriginFromRequest(request)
  const metadataUrl = oauthProtectedResourceMetadataUrl(origin)
  return Response.json(
    { error: message },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer realm="iwoot-mcp", resource_metadata="${metadataUrl}", scope="read write"`,
      },
    }
  )
}

/**
 * Resolve the user for MCP:
 * 1) Shared IWOOT_MCP_TOKEN + IWOOT_MCP_USER_ID (legacy env connector)
 * 2) Opaque iwootmcp_… token from Firestore mcpAccessTokens (manual or OAuth)
 * 3) Firebase ID token → that uid (full read+write)
 *
 * Unauthenticated requests return 401 + WWW-Authenticate so ChatGPT can start OAuth.
 */
export async function authorizeIwootMcp(
  request: Request
): Promise<McpAuthOk | McpAuthFail> {
  const provided = credential(request)
  if (!provided) {
    return {
      response: unauthorizedChallenge(
        request,
        "Missing Authorization Bearer token or x-api-key"
      ),
    }
  }

  const shared = process.env.IWOOT_MCP_TOKEN?.trim()
  const sharedUid = process.env.IWOOT_MCP_USER_ID?.trim()
  if (shared && sharedUid && sameToken(provided, shared)) {
    return { uid: sharedUid, scopes: ["read", "write"] }
  }

  if (provided.startsWith("iwootmcp_")) {
    try {
      const resolved = await resolveMcpAccessToken(provided)
      if (resolved?.uid) {
        return { uid: resolved.uid, scopes: resolved.scopes }
      }
    } catch (e) {
      return {
        response: unauthorizedChallenge(
          request,
          e instanceof Error ? e.message : "Invalid MCP access token"
        ),
      }
    }
  }

  const uid = await getUidFromRequest(
    new Request(request.url, {
      headers: { Authorization: `Bearer ${provided}` },
    })
  )
  if (uid) return { uid, scopes: ["read", "write"] }

  return {
    response: unauthorizedChallenge(
      request,
      "Invalid API key or Firebase token"
    ),
  }
}
