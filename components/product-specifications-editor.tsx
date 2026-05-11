"use client"

import { useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

type Row = { id: string; specKey: string; specValue: string }

function recordToRows(spec: Record<string, string> | undefined): Row[] {
  if (!spec || typeof spec !== "object") return [{ id: "r0", specKey: "", specValue: "" }]
  const entries = Object.entries(spec)
  if (entries.length === 0) return [{ id: "r0", specKey: "", specValue: "" }]
  return entries.map(([specKey, specValue], i) => ({
    id: `r${i}-${specKey}`,
    specKey,
    specValue: String(specValue ?? ""),
  }))
}

function rowsToRecord(rows: Row[]): Record<string, string> | undefined {
  const out: Record<string, string> = {}
  for (const row of rows) {
    const k = row.specKey.trim()
    if (!k) continue
    out[k] = row.specValue.trim()
  }
  return Object.keys(out).length ? out : undefined
}

export type ProductSpecificationsEditorProps = {
  value: Record<string, string> | undefined
  onChange: (next: Record<string, string> | undefined) => void
  disabled?: boolean
}

export function ProductSpecificationsEditor({
  value,
  onChange,
  disabled,
}: ProductSpecificationsEditorProps) {
  const rows = useMemo(() => recordToRows(value), [value])

  const pushChange = useCallback(
    (nextRows: Row[]) => {
      onChange(rowsToRecord(nextRows))
    },
    [onChange]
  )

  const updateRow = (id: string, field: "specKey" | "specValue", v: string) => {
    const next = rows.map((r) => (r.id === id ? { ...r, [field]: v } : r))
    pushChange(next)
  }

  const addRow = () => {
    pushChange([...rows, { id: `r${Date.now()}`, specKey: "", specValue: "" }])
  }

  const removeRow = (id: string) => {
    const next = rows.filter((r) => r.id !== id)
    pushChange(next.length ? next : [{ id: "r0", specKey: "", specValue: "" }])
  }

  return (
    <div className="space-y-3">
      <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_auto] sm:gap-2 sm:px-1 text-xs font-medium text-muted-foreground">
        <span>Specification</span>
        <span>Description / value</span>
        <span className="w-10" />
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex flex-col gap-2 rounded-md border border-border bg-card/50 p-2 sm:grid sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:gap-2"
          >
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground sm:hidden">Specification</Label>
              <Input
                placeholder="e.g. Display"
                value={row.specKey}
                disabled={disabled}
                onChange={(e) => updateRow(row.id, "specKey", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground sm:hidden">Value</Label>
              <Input
                placeholder="e.g. 11-inch OLED"
                value={row.specValue}
                disabled={disabled}
                onChange={(e) => updateRow(row.id, "specValue", e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-destructive"
              disabled={disabled}
              onClick={() => removeRow(row.id)}
              aria-label="Remove row"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={disabled}>
        <Plus className="mr-2 h-4 w-4" />
        Add specification row
      </Button>
    </div>
  )
}
