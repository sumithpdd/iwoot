/**
 * Canonical public origin for MCP OAuth issuer / resource URLs.
 * Prefer NEXT_PUBLIC_APP_URL in production; fall back to request / Vercel.
 */

export function publicOriginFromRequest(request: Request): string {
  const env =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_MCP_HTTP_URL?.trim()
  if (env) {
    try {
      const u = new URL(env.includes("://") ? env : `https://${env}`)
      return u.origin
    } catch {
      /* fall through */
    }
  }

  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https"
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.trim() ||
    "localhost:3000"
  return `${proto}://${host}`
}

export function mcpResourceUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/mcp`
}

export function oauthProtectedResourceMetadataUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/.well-known/oauth-protected-resource/api/mcp`
}
