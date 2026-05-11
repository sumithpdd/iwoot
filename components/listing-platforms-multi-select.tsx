"use client"

import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LISTING_PLATFORM_PRESETS } from "@/lib/data/listing-platform-options"

const MAX_PLATFORMS = 20
const MAX_LABEL_LEN = 80

type Props = {
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

export function ListingPlatformsMultiSelect({ value, onChange, disabled }: Props) {
  const [customDraft, setCustomDraft] = useState("")

  const presetSet = useMemo(() => new Set(value.map(norm)), [value])

  const togglePreset = useCallback(
    (label: string) => {
      const key = norm(label)
      if (presetSet.has(key)) {
        onChange(value.filter((v) => norm(v) !== key))
      } else {
        if (value.length >= MAX_PLATFORMS) return
        onChange([...value, label])
      }
    },
    [value, onChange, presetSet]
  )

  const addCustom = useCallback(() => {
    const raw = customDraft.trim()
    if (!raw || raw.length > MAX_LABEL_LEN) return
    if (value.length >= MAX_PLATFORMS) return
    if (value.some((v) => norm(v) === norm(raw))) {
      setCustomDraft("")
      return
    }
    onChange([...value, raw])
    setCustomDraft("")
  }, [customDraft, value, onChange])

  const removeAt = useCallback(
    (idx: number) => {
      onChange(value.filter((_, i) => i !== idx))
    },
    [value, onChange]
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {LISTING_PLATFORM_PRESETS.map((label) => {
          const checked = presetSet.has(norm(label))
          return (
            <label
              key={label}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:bg-muted/40 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-input accent-primary"
                checked={checked}
                disabled={disabled || (!checked && value.length >= MAX_PLATFORMS)}
                onChange={() => togglePreset(label)}
              />
              <span className="font-medium leading-none">{label}</span>
            </label>
          )
        })}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Other platform</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            placeholder="e.g. Depop"
            maxLength={MAX_LABEL_LEN}
            disabled={disabled || value.length >= MAX_PLATFORMS}
            className="min-w-[160px] flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addCustom()
              }
            }}
          />
          <Button type="button" variant="secondary" disabled={disabled || value.length >= MAX_PLATFORMS} onClick={addCustom}>
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Up to {MAX_PLATFORMS} platforms total. Custom names are saved as typed.
        </p>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((v, i) => (
            <button
              key={`${v}-${i}`}
              type="button"
              disabled={disabled}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
              onClick={() => removeAt(i)}
              title="Click to remove"
            >
              <span className="truncate">{v}</span>
              <span className="text-muted-foreground" aria-hidden>
                ×
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
