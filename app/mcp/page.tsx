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

  const bearerValue = minted
    ? `Bearer ${minted.token}`
    : "Bearer iwootmcp_…your-token…"

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

  const claudeCodeCmd = minted
    ? `claude mcp add --transport http iwoot ${mcpUrl} \\\n  --header "Authorization: Bearer ${minted.token}"`
    : `claude mcp add --transport http iwoot ${mcpUrl} \\\n  --header "Authorization: Bearer iwootmcp_…your-token…"`

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
              <code className="text-xs">NEXT_PUBLIC_APP_URL</code> /{" "}
              <code className="text-xs">NEXT_PUBLIC_MCP_HTTP_URL</code> for a
              stable public origin (required for ChatGPT OAuth issuer).
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
              1. Mint a token
            </CardTitle>
            <CardDescription>
              Create an <code className="text-xs">iwootmcp_…</code> token first,
              then paste it into Claude (or use OAuth for ChatGPT). Shown once —
              revoke anytime below if it leaks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mcp-label">Label</Label>
              <Input
                id="mcp-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="claude"
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
                    "Copy the token now — it will not be shown again. If it appeared in a chat, revoke and mint a new one."}
                </p>
                <p className="text-xs text-muted-foreground">
                  Header value (include the word Bearer and the space)
                </p>
                <code className="block break-all rounded-md bg-muted px-3 py-2 text-xs">
                  {bearerValue}
                </code>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copy(bearerValue, "Bearer value copied")}
                  >
                    Copy Bearer value
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copy(minted.token, "Token copied")}
                  >
                    Copy token only
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Claude (web, desktop, mobile)</CardTitle>
            <CardDescription>
              Same Connectors list everywhere. Custom connectors work on Free,
              Pro, Max, Team, and Enterprise — Free is limited to one custom
              connector.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Go to <strong>Settings → Connectors</strong>, click{" "}
                <strong>Add</strong>, then <strong>Custom → Web</strong>.
              </li>
              <li>
                Name: <code className="text-xs">iwoot</code>
              </li>
              <li>
                URL:{" "}
                <code className="break-all text-xs text-foreground">{mcpUrl}</code>
              </li>
              <li>
                Open <strong>Request headers</strong>. Header name:{" "}
                <code className="text-xs">Authorization</code> (or{" "}
                <code className="text-xs">authorization</code>).
              </li>
              <li>
                Value:{" "}
                <code className="break-all text-xs text-foreground">
                  {bearerValue}
                </code>
                . Include the word <strong>Bearer</strong> and the space after
                it — Claude sends the value exactly as entered and does not add
                a scheme.
              </li>
              <li>
                Save, then turn <strong>iwoot</strong> on from the tools menu in
                a chat.
              </li>
            </ol>
            {minted ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void copy(bearerValue, "Bearer value copied")}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Authorization value
              </Button>
            ) : (
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
                Mint a token above first, then the exact Bearer value to paste
                appears here.
              </p>
            )}
            <p className="text-xs">
              If you don’t see a <strong>Request headers</strong> section, that
              beta hasn’t reached your account yet. Until then use Claude Code
              (below), or ChatGPT OAuth.
            </p>

            <div className="space-y-2 border-t pt-4">
              <p className="font-medium text-foreground">Claude Code</p>
              <pre className="overflow-x-auto rounded-md bg-slate-950 p-3 text-xs text-emerald-200 whitespace-pre-wrap">
                {claudeCodeCmd}
              </pre>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!minted}
                onClick={() => void copy(claudeCodeCmd, "CLI command copied")}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Claude Code command
              </Button>
            </div>

            {minted ? (
              <div className="space-y-2 border-t pt-4">
                <p className="font-medium text-foreground">
                  Optional: local MCP JSON
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
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. ChatGPT (OAuth)</CardTitle>
            <CardDescription>
              ChatGPT custom apps do <strong>not</strong> accept a static Bearer
              header / JSON config. Choose OAuth and sign in to IWOOT.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                ChatGPT → <strong>Settings → Apps</strong> → Developer mode /
                Create app / Add custom MCP server
              </li>
              <li>
                Name: <strong>iWoot</strong>. Server URL:{" "}
                <code className="break-all text-xs text-foreground">{mcpUrl}</code>
              </li>
              <li>
                Authentication: <strong>OAuth</strong> (not “no authentication”,
                and do not paste a Bearer header)
              </li>
              <li>
                Continue → browser opens IWOOT → sign in →{" "}
                <strong>Allow access</strong>
              </li>
              <li>
                Install / enable the app, then mention it in a chat (e.g.{" "}
                <code className="text-xs">@iWoot</code>)
              </li>
            </ol>
            <p className="text-xs">
              Production needs{" "}
              <code className="text-xs">NEXT_PUBLIC_APP_URL=https://iwoot.vercel.app</code>{" "}
              on Vercel so OAuth issuer metadata matches the public origin.
            </p>
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
