import { registerOAuthClient } from "@/lib/server/mcp/oauth"

export const runtime = "nodejs"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

/** Dynamic Client Registration (RFC 7591) — public clients, PKCE only. */
export async function POST(request: Request) {
  let body: {
    client_name?: string
    redirect_uris?: string[]
    token_endpoint_auth_method?: string
  } = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  try {
    const client = await registerOAuthClient({
      clientName: body.client_name,
      redirectUris: body.redirect_uris,
      tokenEndpointAuthMethod: body.token_endpoint_auth_method,
    })
    return Response.json(client, { status: 201, headers: cors })
  } catch (e) {
    return Response.json(
      {
        error: "server_error",
        error_description: e instanceof Error ? e.message : "Registration failed",
      },
      { status: 500, headers: cors }
    )
  }
}
