import { getAuthContext } from "@/lib/server/require-auth"
import {
  assertRedirectAllowed,
  buildAuthorizeErrorRedirect,
  buildAuthorizeRedirect,
  createAuthorizationCode,
  parseAuthorizeParams,
  publicOriginFromRequest,
  validateAuthorizeRequest,
} from "@/lib/server/mcp/oauth"

export const runtime = "nodejs"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

/**
 * Consent approval — browser POSTs after user signs in on /oauth/authorize.
 * Requires Firebase Bearer. Returns JSON { redirect } for the client to navigate,
 * or 303 when Accept prefers redirect.
 */
export async function POST(request: Request) {
  const auth = await getAuthContext(request)
  if (!auth) {
    return Response.json(
      { error: "unauthorized", error_description: "Sign in required" },
      { status: 401, headers: cors }
    )
  }

  const origin = publicOriginFromRequest(request)
  const requestOrigin = request.headers.get("origin")
  if (requestOrigin && requestOrigin !== origin) {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "Cross-origin approval refused",
      },
      { status: 403, headers: cors }
    )
  }

  let body: Record<string, string> = {}
  const ct = request.headers.get("content-type") || ""
  if (ct.includes("application/json")) {
    body = (await request.json().catch(() => ({}))) as Record<string, string>
  } else {
    const form = await request.formData()
    form.forEach((v, k) => {
      if (typeof v === "string") body[k] = v
    })
  }

  const params = parseAuthorizeParams(
    new URLSearchParams({
      response_type: body.response_type || "code",
      client_id: body.client_id || "",
      redirect_uri: body.redirect_uri || "",
      code_challenge: body.code_challenge || "",
      code_challenge_method: body.code_challenge_method || "S256",
      state: body.state || "",
      scope: body.scope || "",
      resource: body.resource || "",
    })
  )

  const validated = validateAuthorizeRequest(params, origin)
  if (!validated.ok) {
    return Response.json(
      { error: validated.error },
      { status: 400, headers: cors }
    )
  }

  const redirectCheck = await assertRedirectAllowed(
    params.clientId,
    params.redirectUri
  )
  if (!redirectCheck.ok) {
    return Response.json(
      { error: "invalid_request", error_description: redirectCheck.error },
      { status: 400, headers: cors }
    )
  }

  if (body.decision === "deny") {
    const redirect = buildAuthorizeErrorRedirect(params.redirectUri, {
      error: "access_denied",
      state: params.state,
      issuer: origin,
      description: "User denied access",
    })
    return Response.json({ redirect }, { headers: cors })
  }

  try {
    const code = await createAuthorizationCode({
      uid: auth.uid,
      email: auth.email,
      clientId: params.clientId,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      scope: params.scope,
      resource: params.resource,
    })
    const redirect = buildAuthorizeRedirect(params.redirectUri, {
      code,
      state: params.state,
      issuer: origin,
    })
    return Response.json({ redirect }, { headers: cors })
  } catch (e) {
    return Response.json(
      {
        error: "server_error",
        error_description: e instanceof Error ? e.message : "Failed to issue code",
      },
      { status: 500, headers: cors }
    )
  }
}
