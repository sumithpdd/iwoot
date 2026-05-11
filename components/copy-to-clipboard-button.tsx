"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

/** Normalize form / watch() values for clipboard text */
export function copyFieldText(value: unknown): string {
  if (value === undefined || value === null) return ""
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : ""
  }
  return String(value)
}

type CopyToClipboardButtonProps = {
  value: string
  /** Shown in toast, e.g. "Website" */
  label?: string
  className?: string
}

export function CopyToClipboardButton({
  value,
  label,
  className,
}: CopyToClipboardButtonProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const trimmed = value.trim()
  const disabled = trimmed.length === 0

  const copy = async () => {
    if (disabled) return
    try {
      await navigator.clipboard.writeText(trimmed)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copied",
        description: label ? `${label} copied to clipboard` : "Copied to clipboard",
      })
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard access was denied or is unavailable.",
        variant: "destructive",
      })
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-9 w-9 shrink-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
        className
      )}
      onClick={copy}
      disabled={disabled}
      title={label ? `Copy ${label}` : "Copy to clipboard"}
      aria-label={label ? `Copy ${label}` : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  )
}
