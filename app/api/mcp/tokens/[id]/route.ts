import { NextResponse } from "next/server"
import {
  getAuthContext,
  unauthorized,
} from "@/lib/server/require-auth"
import { revokeMcpAccessToken } from "@/lib/server/mcp/access-tokens"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Ctx = { params: { id: string } }

export async function DELETE(request: Request, context: Ctx) {
  const auth = await getAuthContext(request)
  if (!auth) return unauthorized()

  const { id } = context.params
  try {
    const ok = await revokeMcpAccessToken(id, { uid: auth.uid })
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Token not found" },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, id, revoked: true })
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      )
    }
    console.error(`DELETE /api/mcp/tokens/${id}`, e)
    return NextResponse.json(
      { success: false, error: "Failed to revoke token" },
      { status: 500 }
    )
  }
}
