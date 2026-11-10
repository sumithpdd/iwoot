import {
  oauthAuthorizationServerMetadata,
  publicOriginFromRequest,
} from "@/lib/server/mcp/oauth"

export const runtime = "nodejs"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Cache-Control": "public, max-age=3600",
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export function GET(request: Request) {
  const origin = publicOriginFromRequest(request)
  return Response.json(oauthAuthorizationServerMetadata(origin), {
    headers: cors,
  })
}
