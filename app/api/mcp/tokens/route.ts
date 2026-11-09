import { NextResponse } from "next/server"
import { z } from "zod"
import {
  getAuthContext,
  unauthorized,
  badRequest,
} from "@/lib/server/require-auth"
import {
  listMcpAccessTokensForUid,
  mintMcpAccessToken,
  type McpTokenScope,
} from "@/lib/server/mcp/access-tokens"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const mintSchema = z.object({
  scopes: z.array(z.enum(["read", "write"])).min(1).max(2).optional(),
  ttlHours: z.number().int().min(1).max(24 * 90).optional(),
  label: z.string().trim().max(80).optional(),
})

export async function GET(request: Request) {
  const auth = await getAuthContext(request)
  if (!auth) return unauthorized()

  try {
    const includeRevoked =
      new URL(request.url).searchParams.get("includeRevoked") === "1"
    const tokens = await listMcpAccessTokensForUid(auth.uid, { includeRevoked })
    return NextResponse.json({ success: true, tokens })
  } catch (e) {
    console.error("GET /api/mcp/tokens", e)
    return NextResponse.json(
      { success: false, error: "Failed to list MCP tokens" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await getAuthContext(request)
  if (!auth) return unauthorized()

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    raw = {}
  }

  const parsed = mintSchema.safeParse(raw)
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message || "Invalid body")
  }

  try {
    const scopes: McpTokenScope[] = parsed.data.scopes?.length
      ? parsed.data.scopes
      : ["read", "write"]

    const minted = await mintMcpAccessToken({
      uid: auth.uid,
      email: auth.email ?? undefined,
      scopes,
      createdByUid: auth.uid,
      label: parsed.data.label,
      ttlHours: parsed.data.ttlHours,
    })

    return NextResponse.json({
      success: true,
      ...minted,
      warning: "Copy the token now — it will not be shown again.",
    })
  } catch (e) {
    console.error("POST /api/mcp/tokens", e)
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Failed to mint token",
      },
      { status: 500 }
    )
  }
}
