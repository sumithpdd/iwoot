import { getAuthContext } from "@/lib/server/require-auth"
import { resolveMcpAccessToken } from "@/lib/server/mcp/access-tokens"

export const runtime = "nodejs"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

async function resolveUser(request: Request) {
  const header = request.headers.get("authorization") || ""
  const token = header.replace(/^Bearer\s+/i, "").trim()
  if (!token) return null

  if (token.startsWith("iwootmcp_")) {
    try {
      const resolved = await resolveMcpAccessToken(token)
      if (!resolved) return null
      return {
        sub: resolved.uid,
        email: resolved.email,
        email_verified: Boolean(resolved.email),
      }
    } catch {
      return null
    }
  }

  const auth = await getAuthContext(request)
  if (!auth) return null
  return {
    sub: auth.uid,
    email: auth.email,
    email_verified: Boolean(auth.email),
  }
}

export async function GET(request: Request) {
  const user = await resolveUser(request)
  if (!user) {
    return Response.json({ error: "invalid_token" }, { status: 401, headers: cors })
  }
  return Response.json(user, { headers: cors })
}

export async function POST(request: Request) {
  return GET(request)
}
