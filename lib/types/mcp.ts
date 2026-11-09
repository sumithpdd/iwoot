export type McpTokenScope = "read" | "write"

export type McpTokenMeta = {
  id: string
  scopes: McpTokenScope[]
  label: string
  createdAt: string
  expiresAt: string
  revoked: boolean
  lastUsedAt?: string
}

export type MintedMcpToken = {
  token: string
  tokenId: string
  scopes: McpTokenScope[]
  expiresAt: string
  label: string
  uid: string
  warning?: string
}
