/**
 * Opaque MCP access tokens (Admin SDK only).
 * Collection: mcpAccessTokens/{id} — client deny in firestore.rules.
 * Plaintext shown once at mint; only sha256 hash stored.
 */

import { createHash, randomBytes } from "node:crypto"
import { getAdminFirestore } from "@/lib/server/firebase-admin"
import type { McpTokenScope, MintedMcpToken } from "@/lib/types/mcp"

export type { McpTokenScope, MintedMcpToken }

export const MCP_ACCESS_TOKENS_COLLECTION = "mcpAccessTokens"

export type McpAccessTokenRecord = {
  id: string
  uid: string
  email?: string
  scopes: McpTokenScope[]
  label: string
  createdByUid: string
  createdAt: string
  expiresAt: string
  revoked: boolean
  revokedAt?: string
  lastUsedAt?: string
}

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex")
}

function newSecretToken(): string {
  return `iwootmcp_${randomBytes(32).toString("base64url")}`
}

function normalizeScopes(scopes: McpTokenScope[]): McpTokenScope[] {
  const set = new Set(scopes.filter((s) => s === "read" || s === "write"))
  if (set.size === 0) set.add("read")
  return [...set]
}

export function serializeTokenMeta(
  id: string,
  data: Record<string, unknown>
): McpAccessTokenRecord {
  return {
    id,
    uid: String(data.uid || ""),
    email: typeof data.email === "string" ? data.email : undefined,
    scopes: Array.isArray(data.scopes)
      ? (data.scopes as unknown[]).filter(
          (s): s is McpTokenScope => s === "read" || s === "write"
        )
      : ["read"],
    label: String(data.label || ""),
    createdByUid: String(data.createdByUid || ""),
    createdAt: String(data.createdAt || ""),
    expiresAt: String(data.expiresAt || ""),
    revoked: data.revoked === true,
    revokedAt: data.revokedAt ? String(data.revokedAt) : undefined,
    lastUsedAt: data.lastUsedAt ? String(data.lastUsedAt) : undefined,
  }
}

export async function mintMcpAccessToken(opts: {
  uid: string
  email?: string
  scopes: McpTokenScope[]
  createdByUid: string
  label?: string
  ttlHours?: number
}): Promise<MintedMcpToken> {
  const scopes = normalizeScopes(opts.scopes)
  const ttlHours = Math.min(Math.max(opts.ttlHours ?? 24 * 30, 1), 24 * 90)
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000)
  const token = newSecretToken()
  const tokenHash = hashToken(token)
  const db = getAdminFirestore()
  const ref = db.collection(MCP_ACCESS_TOKENS_COLLECTION).doc()
  const label = (opts.label || "mcp").trim().slice(0, 80)
  const now = new Date().toISOString()

  await ref.set({
    tokenHash,
    uid: opts.uid,
    email: opts.email ?? null,
    scopes,
    label,
    createdByUid: opts.createdByUid,
    createdAt: now,
    expiresAt: expiresAt.toISOString(),
    revoked: false,
  })

  return {
    token,
    tokenId: ref.id,
    scopes,
    expiresAt: expiresAt.toISOString(),
    label,
    uid: opts.uid,
  }
}

export async function revokeMcpAccessToken(
  tokenId: string,
  opts?: { uid?: string }
): Promise<boolean> {
  const db = getAdminFirestore()
  const ref = db.collection(MCP_ACCESS_TOKENS_COLLECTION).doc(tokenId)
  const snap = await ref.get()
  if (!snap.exists) return false
  const data = snap.data()!
  if (opts?.uid && data.uid !== opts.uid) {
    throw new Error("Forbidden")
  }
  if (data.revoked === true) return true
  await ref.update({
    revoked: true,
    revokedAt: new Date().toISOString(),
  })
  return true
}

export async function listMcpAccessTokensForUid(
  uid: string,
  opts?: { includeRevoked?: boolean }
): Promise<McpAccessTokenRecord[]> {
  const db = getAdminFirestore()
  const snap = await db
    .collection(MCP_ACCESS_TOKENS_COLLECTION)
    .where("uid", "==", uid)
    .limit(100)
    .get()
  return snap.docs
    .map((d) => serializeTokenMeta(d.id, d.data() as Record<string, unknown>))
    .filter((t) => (opts?.includeRevoked ? true : !t.revoked))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
}

export async function resolveMcpAccessToken(rawToken: string): Promise<{
  uid: string
  email?: string
  scopes: McpTokenScope[]
  tokenId: string
} | null> {
  const token = rawToken.trim()
  if (!token.startsWith("iwootmcp_")) return null

  const tokenHash = hashToken(token)
  const db = getAdminFirestore()
  const snap = await db
    .collection(MCP_ACCESS_TOKENS_COLLECTION)
    .where("tokenHash", "==", tokenHash)
    .limit(1)
    .get()

  if (snap.empty) {
    throw new Error("Invalid or unknown MCP access token")
  }

  const doc = snap.docs[0]
  const data = doc.data()
  if (data.revoked === true) {
    throw new Error("MCP access token has been revoked")
  }

  const expiresAt = data.expiresAt ? new Date(String(data.expiresAt)) : null
  if (expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
    throw new Error("MCP access token has expired")
  }

  const scopes = normalizeScopes(
    (Array.isArray(data.scopes) ? data.scopes : ["read"]) as McpTokenScope[]
  )

  void doc.ref.update({ lastUsedAt: new Date().toISOString() }).catch(() => {})

  return {
    uid: String(data.uid || ""),
    email: typeof data.email === "string" ? data.email : undefined,
    scopes,
    tokenId: doc.id,
  }
}
