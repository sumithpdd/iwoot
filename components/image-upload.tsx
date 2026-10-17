"use client"

import { useCallback, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Image as ImageIcon, ChevronUp, ChevronDown, Download, Loader2 } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import {
  uploadImagesViaApi,
  deleteImageViaApi,
  downloadProductPhotosZip,
} from "@/lib/api/storage-client"
import type { ProductImageEntry } from "@/lib/types/product"
import { useToast } from "@/hooks/use-toast"

const MAX_TAG_LEN = 50
const MAX_TAGS = 20

export interface ImageUploadProps {
  images: ProductImageEntry[]
  onImagesChange: (images: ProductImageEntry[]) => void
  maxImages?: number
  folder: "products" | "receipts"
  userId: string
  productId?: string
  receiptId?: string
  disabled?: boolean
  /** Per-image tags (e.g. product photos only) */
  allowTags?: boolean
  /** Move first / last / between */
  allowReorder?: boolean
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 12,
  folder,
  userId: _userId,
  productId,
  receiptId,
  disabled = false,
  allowTags = true,
  allowReorder = true,
}: ImageUploadProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const getToken = useCallback(
    () => user?.getIdToken() ?? Promise.resolve(null),
    [user]
  )
  const [uploading, setUploading] = useState(false)
  const [downloadingZip, setDownloadingZip] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tagDraft, setTagDraft] = useState<Record<number, string>>({})

  const handleDownloadAll = async () => {
    if (!productId || images.length === 0) return
    setDownloadingZip(true)
    try {
      await downloadProductPhotosZip(getToken, productId, images)
      toast({
        title: "Photos downloaded",
        description: "Zip saved — use these files when posting on Gumtree or other sites.",
      })
    } catch (e: unknown) {
      toast({
        title: "Download failed",
        description: e instanceof Error ? e.message : "Could not download photos",
        variant: "destructive",
      })
    } finally {
      setDownloadingZip(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const remainingSlots = maxImages - images.length

    if (fileArray.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s)`)
      return
    }

    setUploading(true)

    try {
      const newUrls = await uploadImagesViaApi(getToken, fileArray, folder, {
        productId,
        receiptId,
      })
      const additions: ProductImageEntry[] = newUrls.map((url) => ({ url, tags: [] }))
      onImagesChange([...images, ...additions])
    } catch (error: unknown) {
      console.error("Upload error:", error)
      const msg = error instanceof Error ? error.message : "Upload failed"
      alert(`Failed to upload images: ${msg}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index]?.url
    if (!imageUrl) return

    if (imageUrl.includes("firebasestorage.googleapis.com")) {
      try {
        await deleteImageViaApi(getToken, imageUrl)
      } catch (error) {
        console.error("Failed to delete image from storage:", error)
      }
    }

    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
    setTagDraft({})
  }

  const move = (from: number, dir: -1 | 1) => {
    const to = from + dir
    if (to < 0 || to >= images.length) return
    const next = [...images]
    const [row] = next.splice(from, 1)
    next.splice(to, 0, row)
    onImagesChange(next)
  }

  const addTag = (index: number, raw: string) => {
    const t = raw.trim().slice(0, MAX_TAG_LEN)
    if (!t) return
    const entry = images[index]
    if (!entry) return
    const existing = entry.tags || []
    if (existing.includes(t) || existing.length >= MAX_TAGS) return
    const next = [...images]
    next[index] = { ...entry, tags: [...existing, t] }
    onImagesChange(next)
    setTagDraft((d) => ({ ...d, [index]: "" }))
  }

  const removeTag = (index: number, tag: string) => {
    const entry = images[index]
    if (!entry?.tags) return
    const next = [...images]
    next[index] = {
      ...entry,
      tags: entry.tags.filter((x) => x !== tag),
    }
    onImagesChange(next)
  }

  const handleAddUrl = () => {
    const url = prompt("Enter image URL:")
    if (url && url.trim()) {
      if (images.length >= maxImages) {
        alert(`You can only have ${maxImages} images`)
        return
      }
      onImagesChange([...images, { url: url.trim(), tags: [] }])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Label>Images</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Drag in files or add a URL. Reorder so your best photo is first. Optional tags help you remember (e.g.
            &quot;serial&quot;, &quot;defect&quot;).
          </p>
        </div>
        {folder === "products" && productId && images.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={downloadingZip || disabled}
            onClick={() => void handleDownloadAll()}
            title="Download all photos as a zip for marketplace uploads"
          >
            {downloadingZip ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download all
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {images.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {images.map((entry, index) => (
              <div
                key={`${entry.url}-${index}`}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-2"
              >
                <div className="relative flex gap-2">
                  <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-md border bg-muted">
                    <Image
                      src={entry.url}
                      alt={entry.tags?.[0] || `Image ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                      }}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                    <p className="truncate text-xs text-muted-foreground" title={entry.url}>
                      {entry.url}
                    </p>
                    <div className="flex flex-wrap items-center gap-1">
                      {allowReorder && !disabled && images.length > 1 && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={index === 0}
                            onClick={() => move(index, -1)}
                            aria-label="Move image up"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={index === images.length - 1}
                            onClick={() => move(index, 1)}
                            aria-label="Move image down"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {!disabled && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => void handleRemoveImage(index)}
                        >
                          <X className="mr-1 h-3 w-3" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {allowTags && (
                  <div className="space-y-1 border-t border-border pt-2">
                    <Label className="text-xs text-muted-foreground">Tags (optional)</Label>
                    <div className="flex flex-wrap gap-1">
                      {(entry.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
                        >
                          {tag}
                          {!disabled && (
                            <button
                              type="button"
                              onClick={() => removeTag(index, tag)}
                              className="rounded hover:bg-destructive/20"
                              aria-label={`Remove tag ${tag}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {!disabled && (
                      <div className="flex gap-1">
                        <Input
                          placeholder="Add tag, press Enter"
                          value={tagDraft[index] ?? ""}
                          onChange={(e) =>
                            setTagDraft((d) => ({ ...d, [index]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addTag(index, tagDraft[index] ?? "")
                            }
                          }}
                          className="h-8 text-xs"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 shrink-0 text-xs"
                          onClick={() => addTag(index, tagDraft[index] ?? "")}
                        >
                          Add
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!disabled && images.length < maxImages && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading…" : "Upload images"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddUrl}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Add URL
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </div>
        )}

        {images.length >= maxImages && !disabled && (
          <p className="text-sm text-muted-foreground">Maximum {maxImages} images reached.</p>
        )}

        <p className="text-xs text-muted-foreground">
          Upload from device or paste URLs. Firebase Storage files are removed when you delete a
          thumbnail. Max {maxImages} images, 5MB per file.
        </p>
      </div>
    </div>
  )
}
