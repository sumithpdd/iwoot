"use client"

import { useState } from "react"
import type { UseFormSetValue, FieldValues, Path } from "react-hook-form"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { ProductType } from "@/lib/types/product"

type Props<T extends FieldValues> = {
  productType: ProductType
  fieldKey: Path<T> & string
  shortLabel: string
  getFormValues: () => Partial<T>
  setValue: UseFormSetValue<T>
}

export function AiProductFieldAssist<T extends FieldValues>({
  productType,
  fieldKey,
  shortLabel,
  getFormValues,
  setValue,
}: Props<T>) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (!user || !prompt.trim()) return
    setBusy(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/ai/product-assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          field: fieldKey,
          productType,
          currentValues: getFormValues(),
        }),
      })
      const text = await res.text()
      if (!res.ok) {
        try {
          const j = JSON.parse(text) as { error?: string }
          throw new Error(j.error || text)
        } catch (e) {
          if (e instanceof Error && e.message !== "Unexpected end of JSON input") throw e
          throw new Error(text || res.statusText)
        }
      }
      const data = JSON.parse(text) as {
        fields?: Record<string, unknown>
      }
      const fields = data.fields ?? {}
      let applied = 0
      for (const [key, val] of Object.entries(fields)) {
        if (val === undefined || val === null) continue
        setValue(key as Path<T>, val as never, { shouldDirty: true })
        applied++
      }
      toast({
        title: applied ? "Fields updated" : "No changes",
        description: applied
          ? `Applied ${applied} suggestion(s). Review before saving.`
          : "Try a clearer instruction.",
      })
      setOpen(false)
      setPrompt("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI assist failed"
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40"
        title={`Fill ${shortLabel} with AI`}
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI · {shortLabel}</DialogTitle>
            <DialogDescription>
              Your current <strong>name, brand, model, SKU</strong>, and other filled fields
              are sent to the server together with your note. We also query free catalog
              APIs when possible (<strong>UPCitemdb</strong> for barcode/name;{" "}
              <strong>Open Food Facts</strong> when the SKU looks like a food barcode) to
              help Gemini draft description and related fields — always review before saving.
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="min-h-[120px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Add context: retailer, variant, warranty, what you want in the description, target use… (name / model / SKU above are already included)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy || !prompt.trim()}
              onClick={run}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
            >
              {busy ? "Generating…" : "Apply suggestions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
