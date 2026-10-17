"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageSquare, X } from "lucide-react"
import type { UIMessage } from "ai"

const QUICK_PROMPTS = [
  "What Sonos do I have?",
  "Help me sell my Sonos Move on Gumtree",
  "Compare prices for Nebula Cosmos Max",
  "Draft a Shpock listing for my Nebula projector",
  "What am I currently selling?",
] as const

function textFromMessage(m: UIMessage) {
  if (!m.parts?.length) return ""
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

export function AiChatPanel() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async (): Promise<Record<string, string>> => {
          if (!user) return {}
          const token = await user.getIdToken()
          return { Authorization: `Bearer ${token}` }
        },
      }),
    [user]
  )

  const { messages, sendMessage, status, error } = useChat({ transport })

  if (!user) return null

  const busy = status === "streaming" || status === "submitted"

  return (
    <>
      <Button
        type="button"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close AI chat" : "Open AI chat"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>
      {open && (
        <Card className="fixed bottom-24 right-6 z-50 flex h-[min(520px,75vh)] w-[min(100vw-2rem,420px)] flex-col overflow-hidden border-2 shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 bg-white/90 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/90">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              IWOOT · Gemini
            </span>
            <span className="text-xs text-gray-500">Inventory + sell help</span>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-gray-500 dark:text-gray-400">
                  Track have/want items, compare Gumtree · CeX · Shpock, and draft listings.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((prompt) => (
                    <Button
                      key={prompt}
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-auto whitespace-normal px-2 py-1 text-left text-xs"
                      disabled={busy}
                      onClick={() => void sendMessage({ text: prompt })}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "text-right" : "text-left"}
              >
                <div
                  className={`inline-block max-w-[90%] rounded-lg px-3 py-2 whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  }`}
                >
                  {textFromMessage(m)}
                </div>
              </div>
            ))}
            {busy && <p className="text-xs text-gray-500">Thinking…</p>}
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {error.message ||
                  "Chat failed. Check GOOGLE_GENERATIVE_AI_API_KEY and GEMINI_MODEL."}
              </p>
            )}
          </div>
          <form
            className="flex gap-2 border-t border-gray-200 p-3 dark:border-gray-700"
            onSubmit={async (e) => {
              e.preventDefault()
              const form = e.currentTarget
              const data = new FormData(form)
              const text = (data.get("msg") as string)?.trim()
              if (!text) return
              await sendMessage({ text })
              form.reset()
            }}
          >
            <input
              name="msg"
              className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              placeholder="Ask about inventory or selling…"
              autoComplete="off"
            />
            <Button type="submit" disabled={busy}>
              Send
            </Button>
          </form>
        </Card>
      )}
    </>
  )
}
