"use client"

import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

function safeHostname(url: string): { host: string; ok: boolean } {
  try {
    return { host: new URL(url).hostname, ok: true }
  } catch {
    return { host: "", ok: false }
  }
}

type WebsiteLinkPreviewProps = {
  url: string
  className?: string
  /** Hide full URL line; show hostname + link only */
  compact?: boolean
}

/**
 * Clickable “preview” row: favicon + hostname + open in new tab (no server-side OG fetch).
 */
export function WebsiteLinkPreview({
  url,
  className,
  compact = false,
}: WebsiteLinkPreviewProps) {
  const trimmed = url?.trim() ?? ""
  const { host, ok } = safeHostname(trimmed)

  if (!trimmed || !ok) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Enter a valid URL to see a preview link.
      </p>
    )
  }

  const faviconSrc = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`

  return (
    <a
      href={trimmed}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${host} in a new tab`}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted/70 hover:border-primary/40",
        compact && "gap-2 px-2 py-1.5 text-xs",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={faviconSrc}
        alt=""
        width={compact ? 24 : 32}
        height={compact ? 24 : 32}
        className={cn(
          "shrink-0 rounded bg-background object-contain ring-1 ring-border",
          compact ? "h-6 w-6" : "h-8 w-8"
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-foreground group-hover:underline">
          {host}
        </div>
        {!compact && (
          <div className="truncate text-xs text-muted-foreground" title={trimmed}>
            {trimmed}
          </div>
        )}
      </div>
      <ExternalLink
        className={cn(
          "shrink-0 text-muted-foreground group-hover:text-foreground",
          compact ? "h-3 w-3" : "h-4 w-4"
        )}
        aria-hidden
      />
    </a>
  )
}
