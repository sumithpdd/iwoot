/**
 * Lightweight OAuth 2.1 authorization server for ChatGPT / Claude MCP connectors.
 * Authorization-code + PKCE (S256). Access tokens reuse mcpAccessTokens (iwootmcp_…).
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import { getAdminFirestore } from "@/lib/server/firebase-admin"
import { mintMcpAccessToken } from "@/lib/server/mcp/access-tokens"
import type { McpTokenScope } from "@/lib/types/mcp"
import {
  mcpResourceUrl,
  publicOriginFromRequest,
} from "@/lib/server/mcp/public-origin"

export const MCP_OAUTH_CODES = "mcpOAuthCodes"
export const MCP_OAUTH_CLIENTS = "mcpOAuthClients"

const CODE_TTL_MS = 5 * 60 * 1000
const CLIENT_TTL_MS = 90 * 24 * 60 * 60 * 1000

const ALLOWED_REDIRECT_HOSTS = new Set([
  "chatgpt.com",
  "chat.openai.com",
  "platform.openai.com",
  "claude.ai",
  "www.claude.ai",
  "cursor.com",
  "www.cursor.com",
])

export type OAuthAuthorizeParams = {
  responseType: string
  clientId: string
  redirectUri: string
  codeChallenge: string
  codeChallengeMethod: string
  state: string | null
  scope: string | null
  resource: string | null
}

export function parseAuthorizeParams(
  searchParams: URLSearchParams
): OAuthAuthorizeParams {
  return {
    responseType: (searchParams.get("response_type") || "").trim(),
    clientId: (searchParams.get("client_id") || "").trim(),
    redirectUri: (searchParams.get("redirect_uri") || "").trim(),
    codeChallenge: (searchParams.get("code_challenge") || "").trim(),
    codeChallengeMethod: (
      searchParams.get("code_challenge_method") || "S256"
    ).trim(),
    state: searchParams.get("state"),
    scope: searchParams.get("scope"),
    resource: searchParams.get("resource"),
  }
}

export function oauthAuthorizationServerMetadata(origin: string) {
  const base = origin.replace(/\/$/, "")
  return {
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    registration_endpoint: `${base}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    client_id_metadata_document_supported: true,
    authorization_response_iss_parameter_supported: true,
    scopes_supported: ["read", "write", "openid", "email", "profile"],
    service_documentation: `${base}/mcp`,
  }
}

export function oauthProtectedResourceMetadata(origin: string) {
  const base = origin.replace(/\/$/, "")
  return {
    resource: mcpResourceUrl(base),
    authorization_servers: [base],
    scopes_supported: ["read", "write"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${base}/mcp`,
  }
}

export function verifyPkceS256(verifier: string, challenge: string): boolean {
  const computed = createHash("sha256").update(verifier, "utf8").digest("base64url")
  const a = Buffer.from(computed)
  const b = Buffer.from(challenge)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function newAuthCode(): string {
  return `iwootac_${randomBytes(24).toString("base64url")}`
}

export function scopesFromRequest(scope: string | null | undefined): McpTokenScope[] {
  const parts = (scope || "")
    .split(/[\s+,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const out = new Set<McpTokenScope>()
  for (const p of parts) {
    if (p === "read" || p === "openid" || p === "email" || p === "profile") {
      out.add("read")
    }
    if (p === "write") out.add("write")
  }
  if (out.size === 0) {
    out.add("read")
    out.add("write")
  }
  return [...out]
}

function isAllowedRedirectHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (ALLOWED_REDIRECT_HOSTS.has(host)) return true
  if (host.endsWith(".openai.com")) return true
  if (host.endsWith(".chatgpt.com")) return true
  if (host === "localhost" || host === "127.0.0.1") return true
  return false
}

export async function resolveAllowedRedirectUris(
  clientId: string
): Promise<string[] | "open-host-allowlist"> {
  if (clientId.startsWith("https://") || clientId.startsWith("http://")) {
    try {
      const res = await fetch(clientId, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const doc = (await res.json()) as {
          client_id?: string
          redirect_uris?: string[]
        }
        if (doc.client_id && doc.client_id !== clientId) {
          // Mismatch — fall through to host allowlist for known OpenAI hosts
        } else if (
          Array.isArray(doc.redirect_uris) &&
          doc.redirect_uris.length > 0
        ) {
          return doc.redirect_uris.filter((u) => typeof u === "string")
        }
      }
    } catch {
      /* CIMD fetch failed — allow known hosts below */
    }
    try {
      const host = new URL(clientId).hostname.toLowerCase()
      if (
        host === "chatgpt.com" ||
        host.endsWith(".chatgpt.com") ||
        host.endsWith(".openai.com") ||
        host === "claude.ai" ||
        host.endsWith(".claude.ai")
      ) {
        return "open-host-allowlist"
      }
    } catch {
      return []
    }
    return "open-host-allowlist"
  }

  const db = getAdminFirestore()
  const snap = await db.collection(MCP_OAUTH_CLIENTS).doc(clientId).get()
  if (snap.exists) {
    const data = snap.data() || {}
    const uris = Array.isArray(data.redirectUris)
      ? (data.redirectUris as unknown[]).filter(
          (u): u is string => typeof u === "string"
        )
      : []
    if (uris.length > 0) return uris
  }

  return "open-host-allowlist"
}

export async function assertRedirectAllowed(
  clientId: string,
  redirectUri: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  let parsed: URL
  try {
    parsed = new URL(redirectUri)
  } catch {
    return { ok: false, error: "invalid redirect_uri" }
  }
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    return { ok: false, error: "redirect_uri must be https" }
  }

  const allowed = await resolveAllowedRedirectUris(clientId)
  if (allowed === "open-host-allowlist") {
    if (!isAllowedRedirectHost(parsed.hostname)) {
      return { ok: false, error: "redirect_uri host not allowed" }
    }
    return { ok: true }
  }
  if (!allowed.includes(redirectUri)) {
    return { ok: false, error: "redirect_uri not registered for client" }
  }
  return { ok: true }
}

export async function registerOAuthClient(input: {
  clientName?: string
  redirectUris?: string[]
  tokenEndpointAuthMethod?: string
}): Promise<{
  client_id: string
  client_name: string
  redirect_uris: string[]
  grant_types: string[]
  response_types: string[]
  token_endpoint_auth_method: string
  client_id_issued_at: number
}> {
  const clientId = `iwootcli_${randomBytes(12).toString("base64url")}`
  const redirectUris = (input.redirectUris || []).filter(
    (u) => typeof u === "string" && u.trim()
  )
  const clientName = (input.clientName || "MCP Client").trim().slice(0, 120)
  const authMethod =
    input.tokenEndpointAuthMethod === "none" || !input.tokenEndpointAuthMethod
      ? "none"
      : "none"

  const db = getAdminFirestore()
  const now = Date.now()
  await db
    .collection(MCP_OAUTH_CLIENTS)
    .doc(clientId)
    .set({
      clientName,
      redirectUris,
      tokenEndpointAuthMethod: authMethod,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + CLIENT_TTL_MS).toISOString(),
    })

  return {
    client_id: clientId,
    client_name: clientName,
    redirect_uris: redirectUris,
    grant_types: ["authorization_code"],
    response_types: ["code"],
    token_endpoint_auth_method: authMethod,
    client_id_issued_at: Math.floor(now / 1000),
  }
}

export async function createAuthorizationCode(input: {
  uid: string
  email?: string
  clientId: string
  redirectUri: string
  codeChallenge: string
  scope: string | null
  resource: string | null
}): Promise<string> {
  const code = newAuthCode()
  const db = getAdminFirestore()
  const now = Date.now()
  await db.collection(MCP_OAUTH_CODES).doc(code).set({
    uid: input.uid,
    email: input.email ?? null,
    clientId: input.clientId,
    redirectUri: input.redirectUri,
    codeChallenge: input.codeChallenge,
    scope: input.scope ?? "read write",
    resource: input.resource ?? null,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + CODE_TTL_MS).toISOString(),
    used: false,
  })
  return code
}

export async function exchangeAuthorizationCode(input: {
  code: string
  codeVerifier: string
  clientId?: string | null
  redirectUri?: string | null
  resource?: string | null
  origin: string
}): Promise<
  | {
      ok: true
      accessToken: string
      expiresIn: number
      scope: string
      tokenType: "Bearer"
    }
  | { ok: false; error: string; status: number }
> {
  const db = getAdminFirestore()
  const ref = db.collection(MCP_OAUTH_CODES).doc(input.code)
  const snap = await ref.get()
  if (!snap.exists) {
    return { ok: false, error: "invalid_grant", status: 400 }
  }
  const data = snap.data()!
  if (data.used === true) {
    return { ok: false, error: "invalid_grant", status: 400 }
  }
  const expiresAt = data.expiresAt ? new Date(String(data.expiresAt)).getTime() : 0
  if (!expiresAt || expiresAt < Date.now()) {
    await ref.delete().catch(() => {})
    return { ok: false, error: "invalid_grant", status: 400 }
  }
  if (
    input.clientId &&
    String(data.clientId) &&
    input.clientId !== String(data.clientId)
  ) {
    return { ok: false, error: "invalid_grant", status: 400 }
  }
  if (
    input.redirectUri &&
    String(data.redirectUri) &&
    input.redirectUri !== String(data.redirectUri)
  ) {
    return { ok: false, error: "invalid_grant", status: 400 }
  }

  const expectedResource = data.resource
    ? String(data.resource)
    : mcpResourceUrl(input.origin)
  if (input.resource && input.resource !== expectedResource) {
    return { ok: false, error: "invalid_target", status: 400 }
  }

  if (!verifyPkceS256(input.codeVerifier, String(data.codeChallenge || ""))) {
    return { ok: false, error: "invalid_grant", status: 400 }
  }

  await ref.update({ used: true, usedAt: new Date().toISOString() })

  const scopes = scopesFromRequest(
    typeof data.scope === "string" ? data.scope : "read write"
  )
  const minted = await mintMcpAccessToken({
    uid: String(data.uid),
    email: typeof data.email === "string" ? data.email : undefined,
    scopes,
    createdByUid: String(data.uid),
    label: `oauth:${String(data.clientId || "client").slice(0, 40)}`,
    ttlHours: 24 * 30,
  })

  const expiresIn = Math.max(
    60,
    Math.floor((new Date(minted.expiresAt).getTime() - Date.now()) / 1000)
  )

  return {
    ok: true,
    accessToken: minted.token,
    expiresIn,
    scope: scopes.join(" "),
    tokenType: "Bearer",
  }
}

export function validateAuthorizeRequest(
  params: OAuthAuthorizeParams,
  origin: string
): { ok: true } | { ok: false; error: string } {
  if (params.responseType !== "code") {
    return { ok: false, error: "unsupported_response_type" }
  }
  if (!params.clientId) return { ok: false, error: "invalid_request: client_id" }
  if (!params.redirectUri) {
    return { ok: false, error: "invalid_request: redirect_uri" }
  }
  if (!params.codeChallenge) {
    return { ok: false, error: "invalid_request: code_challenge" }
  }
  if (params.codeChallengeMethod !== "S256") {
    return { ok: false, error: "invalid_request: code_challenge_method" }
  }
  if (params.resource) {
    const expected = mcpResourceUrl(origin)
    if (params.resource !== expected && params.resource !== `${expected}/`) {
      // Also accept bare origin for lenient clients
      if (params.resource !== origin && params.resource !== `${origin}/`) {
        return { ok: false, error: "invalid_target" }
      }
    }
  }
  return { ok: true }
}

export function buildAuthorizeRedirect(
  redirectUri: string,
  opts: { code: string; state: string | null; issuer: string }
): string {
  const u = new URL(redirectUri)
  u.searchParams.set("code", opts.code)
  if (opts.state) u.searchParams.set("state", opts.state)
  u.searchParams.set("iss", opts.issuer)
  return u.toString()
}

export function buildAuthorizeErrorRedirect(
  redirectUri: string,
  opts: { error: string; state: string | null; issuer: string; description?: string }
): string {
  const u = new URL(redirectUri)
  u.searchParams.set("error", opts.error)
  if (opts.description) u.searchParams.set("error_description", opts.description)
  if (opts.state) u.searchParams.set("state", opts.state)
  u.searchParams.set("iss", opts.issuer)
  return u.toString()
}

export { publicOriginFromRequest, mcpResourceUrl }
