"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, Copy, KeyRound, Plug } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { McpService } from "@/lib/services/mcp.service"
import type { MintedMcpToken, McpTokenMeta } from "@/lib/types/mcp"

export default function McpSettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [tokens, setTokens] = useState<McpTokenMeta[]>([])
  const [busy, setBusy] = useState(false)
  const [minted, setMinted] = useState<MintedMcpToken | null>(null)
  const [label, setLabel] = useState("claude-desktop")
  const [readOnly, setReadOnly] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getToken = useCallback(
    () => user?.getIdToken() ?? Promise.resolve(null),
    [user]
  )

  const mcpUrl = useMemo(() => {
    if (typeof window === "undefined") return "/api/mcp"
    return (
      process.env.NEXT_PUBLIC_MCP_HTTP_URL?.trim() ||
      `${window.location.origin}/api/mcp`
    )
  }, [])

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  const load = useCallback(async () => {
    if (!user) return
    try {
      const list = await McpService.listTokens(getToken)
      setTokens(list)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tokens")
    }
  }, [user, getToken])

  useEffect(() => {
    void load()
  }, [load])

  async function mint() {
    setBusy(true)
    setMinted(null)
    setError(null)
    try {
      const scopes = readOnly
        ? (["read"] as const)
        : (["read", "write"] as const)
      const result = await McpService.mintToken(getToken, {
        label,
        scopes: [...scopes],
      })
      setMinted(result)
      await load()
      toast({
        title: "Token created",
        description: "Copy it now — it won’t be shown again.",
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mint failed")
    } finally {
      setBusy(false)
    }
  }

  async function revoke(id: string) {
    if (
      !confirm("Revoke this MCP token? Connectors using it will stop working.")
    ) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await McpService.revokeToken(getToken, id)
      await load()
      toast({ title: "Token revoked" })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revoke failed")
    } finally {
      setBusy(false)
    }
  }

  async function copy(text: string, what = "Copied") {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: what })
    } catch {
      toast({ title: "Copy failed", variant: "destructive" })
    }
  }

  const connectorJson = minted
    ? JSON.stringify(
        {
          mcpServers: {
            iwoot: {
              url: mcpUrl,
              headers: { Authorization: `Bearer ${minted.token}` },
            },
          },
        },
        null,
        2
      )
    : ""

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Toaster />
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Connectors
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">MCP settings</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Connect Claude, ChatGPT, or Cursor to IWOOT. Tokens are scoped to your
            account — same inventory and research as the web app. Gemini stays on
            the server; never put Firebase or Gemini secrets in the LLM client.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hosted MCP URL</CardTitle>
            <CardDescription>
              Point your connector here. Optional env{" "}
              <code className="text-xs">NEXT_PUBLIC_MCP_HTTP_URL</code> for a
              custom domain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <code className="block break-all rounded-md bg-muted px-3 py-2 text-sm">
              {mcpUrl}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void copy(mcpUrl, "URL copied")}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Mint access token
            </CardTitle>
            <CardDescription>
              Shown once. Use as{" "}
              <code className="text-xs">Authorization: Bearer iwootmcp_…</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mcp-label">Label</Label>
              <Input
                id="mcp-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="claude-desktop"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={readOnly}
                onChange={(e) => setReadOnly(e.target.checked)}
                className="rounded border"
              />
              Read-only (list inventory / research; no create or update tools)
            </label>
            <Button type="button" disabled={busy} onClick={() => void mint()}>
              {busy ? "Working…" : "Create token"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {minted && (
              <div className="space-y-3 border-t pt-4">
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  {minted.warning ||
                    "Copy the token now — it will not be shown again."}
                </p>
                <p className="text-xs text-muted-foreground">Token (shown once)</p>
                <code className="block break-all rounded-md bg-muted px-3 py-2 text-xs">
                  {minted.token}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void copy(minted.token, "Token copied")}
                >
                  Copy token
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Example connector config
                </p>
                <pre className="overflow-x-auto rounded-md bg-slate-950 p-3 text-xs text-emerald-200">
                  {connectorJson}
                </pre>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void copy(connectorJson, "JSON copied")}
                >
                  Copy JSON
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your tokens</CardTitle>
            <CardDescription>Active tokens for this account</CardDescription>
          </CardHeader>
          <CardContent>
            {tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active tokens.</p>
            ) : (
              <ul className="divide-y">
                {tokens.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{t.label}</p>
                      <p className="text-muted-foreground">
                        {t.scopes.join(", ")} · expires{" "}
                        {t.expiresAt
                          ? new Date(t.expiresAt).toLocaleDateString()
                          : "—"}
                        {t.lastUsedAt
                          ? ` · last used ${new Date(t.lastUsedAt).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      className="text-destructive"
                      onClick={() => void revoke(t.id)}
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Guide: <code>docs/MCP.md</code>. Prefer minted <code>iwootmcp_</code>{" "}
          tokens from this page over the legacy env <code>IWOOT_MCP_TOKEN</code>.
        </p>
      </main>
    </div>
  )
}
