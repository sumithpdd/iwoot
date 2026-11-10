"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Plug, ShieldCheck } from "lucide-react"

function clientLabel(clientId: string): string {
  if (!clientId) return "an MCP client"
  try {
    if (clientId.startsWith("http")) {
      const host = new URL(clientId).hostname
      if (host.includes("chatgpt") || host.includes("openai")) return "ChatGPT"
      if (host.includes("claude")) return "Claude"
      if (host.includes("cursor")) return "Cursor"
      return host
    }
  } catch {
    /* fall through */
  }
  if (clientId.startsWith("iwootcli_")) return "a registered MCP connector"
  return clientId.slice(0, 48)
}

function redirectHost(redirectUri: string): string {
  try {
    return new URL(redirectUri).hostname
  } catch {
    return redirectUri || "(unknown)"
  }
}

function AuthorizeInner() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const params = useMemo(() => {
    const qs = new URLSearchParams(searchParams.toString())
    return {
      response_type: qs.get("response_type") || "code",
      client_id: qs.get("client_id") || "",
      redirect_uri: qs.get("redirect_uri") || "",
      code_challenge: qs.get("code_challenge") || "",
      code_challenge_method: qs.get("code_challenge_method") || "S256",
      state: qs.get("state") || "",
      scope: qs.get("scope") || "read write",
      resource: qs.get("resource") || "",
    }
  }, [searchParams])

  const returnTo = useMemo(() => {
    const q = searchParams.toString()
    return `/oauth/authorize${q ? `?${q}` : ""}`
  }, [searchParams])

  async function decide(decision: "allow" | "deny") {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(returnTo)}`)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/oauth/authorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...params, decision }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        redirect?: string
        error?: string
        error_description?: string
      }
      if (!res.ok || !data.redirect) {
        throw new Error(
          data.error_description || data.error || `Approve failed (${res.status})`
        )
      }
      window.location.assign(data.redirect)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authorization failed")
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Plug className="h-4 w-4" />
              IWOOT MCP
            </p>
            <CardTitle className="text-xl">Connect {clientLabel(params.client_id)}</CardTitle>
            <CardDescription>
              This app wants access to your IWOOT inventory and buying research
              (same tools as the dashboard chat). Codes are short-lived; you can
              revoke tokens later at{" "}
              <Link href="/mcp" className="underline">
                MCP settings
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Redirect host:</span>{" "}
                <code className="text-xs">{redirectHost(params.redirect_uri)}</code>
              </p>
              <p>
                <span className="text-muted-foreground">Scopes:</span>{" "}
                {params.scope || "read write"}
              </p>
              {user ? (
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Signed in as {user.email || user.uid}
                </p>
              ) : (
                <p className="text-amber-700 dark:text-amber-400">
                  Sign in to continue.
                </p>
              )}
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {!user ? (
                <Button
                  type="button"
                  onClick={() =>
                    router.push(`/login?next=${encodeURIComponent(returnTo)}`)
                  }
                >
                  Sign in to approve
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void decide("deny")}
                  >
                    Deny
                  </Button>
                  <Button
                    type="button"
                    disabled={busy || !params.client_id || !params.redirect_uri}
                    onClick={() => void decide("allow")}
                  >
                    {busy ? "Connecting…" : "Allow access"}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function OAuthAuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
        </div>
      }
    >
      <AuthorizeInner />
    </Suspense>
  )
}
