import {
  exchangeAuthorizationCode,
  publicOriginFromRequest,
} from "@/lib/server/mcp/oauth"

export const runtime = "nodejs"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, mcp-protocol-version",
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

async function readForm(request: Request): Promise<URLSearchParams> {
  const ct = request.headers.get("content-type") || ""
  if (ct.includes("application/json")) {
    const json = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(json)) {
      if (v === undefined || v === null) continue
      params.set(k, String(v))
    }
    return params
  }
  const text = await request.text()
  return new URLSearchParams(text)
}

export async function POST(request: Request) {
  const params = await readForm(request)
  const grantType = (params.get("grant_type") || "").trim()
  const origin = publicOriginFromRequest(request)

  if (grantType !== "authorization_code") {
    return Response.json(
      {
        error: "unsupported_grant_type",
        error_description: "Only authorization_code is supported",
      },
      { status: 400, headers: cors }
    )
  }

  const code = (params.get("code") || "").trim()
  const codeVerifier = (params.get("code_verifier") || "").trim()
  if (!code || !codeVerifier) {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "code and code_verifier are required",
      },
      { status: 400, headers: cors }
    )
  }

  const result = await exchangeAuthorizationCode({
    code,
    codeVerifier,
    clientId: params.get("client_id"),
    redirectUri: params.get("redirect_uri"),
    resource: params.get("resource"),
    origin,
  })

  if (!result.ok) {
    return Response.json(
      { error: result.error },
      { status: result.status, headers: cors }
    )
  }

  return Response.json(
    {
      access_token: result.accessToken,
      token_type: result.tokenType,
      expires_in: result.expiresIn,
      scope: result.scope,
    },
    { headers: cors }
  )
}
