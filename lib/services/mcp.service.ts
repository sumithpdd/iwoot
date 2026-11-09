/**
 * MCP settings — mint / list / revoke opaque connector tokens via API.
 */

import { apiRequest } from "@/lib/api/http"
import type {
  MintedMcpToken,
  McpTokenMeta,
  McpTokenScope,
} from "@/lib/types/mcp"

type TokenListResponse = { success: true; tokens: McpTokenMeta[] }
type MintResponse = { success: true } & MintedMcpToken
type RevokeResponse = { success: true; id: string; revoked: true }
type FailResponse = { success: false; error?: string }

function assertOk<T extends { success: boolean }>(
  res: T | FailResponse | undefined,
  fallback: string
): asserts res is T & { success: true } {
  if (!res || typeof res !== "object" || !("success" in res) || !res.success) {
    throw new Error((res as FailResponse)?.error || fallback)
  }
}

export class McpService {
  static async listTokens(
    getToken: () => Promise<string | null>,
    opts?: { includeRevoked?: boolean }
  ): Promise<McpTokenMeta[]> {
    const qs = opts?.includeRevoked ? "?includeRevoked=1" : ""
    const res = await apiRequest<TokenListResponse | FailResponse>(
      getToken,
      `/api/mcp/tokens${qs}`
    )
    assertOk(res, "Failed to list MCP tokens")
    return res.tokens || []
  }

  static async mintToken(
    getToken: () => Promise<string | null>,
    body: {
      label?: string
      scopes?: McpTokenScope[]
      ttlHours?: number
    }
  ): Promise<MintedMcpToken> {
    const res = await apiRequest<MintResponse | FailResponse>(
      getToken,
      "/api/mcp/tokens",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    )
    assertOk(res, "Failed to mint MCP token")
    const { success: _s, ...minted } = res
    return minted
  }

  static async revokeToken(
    getToken: () => Promise<string | null>,
    tokenId: string
  ): Promise<void> {
    if (!tokenId.trim()) throw new Error("tokenId is required")
    const res = await apiRequest<RevokeResponse | FailResponse>(
      getToken,
      `/api/mcp/tokens/${encodeURIComponent(tokenId)}`,
      { method: "DELETE" }
    )
    assertOk(res, "Failed to revoke MCP token")
  }
}
