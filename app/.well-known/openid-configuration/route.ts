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

/** OIDC discovery alias — same AS metadata (ChatGPT enterprise email checks). */
export function GET(request: Request) {
  const origin = publicOriginFromRequest(request)
  const meta = oauthAuthorizationServerMetadata(origin)
  return Response.json(
    {
      ...meta,
      userinfo_endpoint: `${origin}/api/oauth/userinfo`,
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["none"],
    },
    { headers: cors }
  )
}
