"use client"

import { sanitizeProductHtml } from "@/lib/utils/sanitize-product-html"
import { htmlToPlainText } from "@/lib/utils/html-plain-text"
import { cn } from "@/lib/utils"

type ProductDescriptionDisplayProps = {
  html: string | undefined
  /** Table / list rows: single line plain preview */
  mode?: "preview" | "block"
  className?: string
}

export function ProductDescriptionDisplay({
  html,
  mode = "preview",
  className,
}: ProductDescriptionDisplayProps) {
  const raw = html?.trim() ?? ""
  if (!raw) return null

  const plain = htmlToPlainText(raw)
  const looksHtml = /<[^>]+>/.test(raw)

  if (mode === "preview" || !looksHtml) {
    return (
      <span className={cn("text-muted-foreground line-clamp-2", className)} title={plain}>
        {plain}
      </span>
    )
  }

  const safe = sanitizeProductHtml(raw)
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none text-muted-foreground line-clamp-3 [&_p]:my-1 [&_ul]:my-1",
        className
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
