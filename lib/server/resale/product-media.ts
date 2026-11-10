/**
 * Attach product photos from HTTPS URLs or data: URLs into Firebase Storage.
 * MCP / ChatGPT cannot upload binary blobs reliably — pass image URLs instead.
 */

import {
  getProductById,
  updateProductDoc,
} from "@/lib/server/repositories/products.repository"
import { uploadUserAsset } from "@/lib/server/storage-admin"
import { normalizeProductImages } from "@/lib/utils/product-images"
import { isAbsoluteUrl } from "@/lib/utils/http-url"
import type { ProductImageEntry } from "@/lib/types/product"

const MAX_ATTACH = 12

function extFromContentType(ct: string, fallbackUrl: string): string {
  if (ct.includes("png")) return "png"
  if (ct.includes("webp")) return "webp"
  if (ct.includes("gif")) return "gif"
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg"
  const m = fallbackUrl.match(/\.(png|jpe?g|webp|gif)(\?|$)/i)
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg"
}

async function bufferFromSource(
  source: string
): Promise<{ buffer: Buffer; contentType: string; originalName: string }> {
  if (source.startsWith("data:")) {
    const match = /^data:([^;,]+);base64,(.+)$/i.exec(source)
    if (!match) throw new Error("Invalid data URL (need base64 image)")
    const contentType = match[1].trim() || "image/jpeg"
    if (!contentType.startsWith("image/")) {
      throw new Error("data URL must be an image/* type")
    }
    const buffer = Buffer.from(match[2], "base64")
    const ext = extFromContentType(contentType, "")
    return { buffer, contentType, originalName: `upload.${ext}` }
  }

  if (!isAbsoluteUrl(source)) {
    throw new Error("Image source must be an https URL or data:image URL")
  }

  const res = await fetch(source, {
    signal: AbortSignal.timeout(20000),
    headers: { Accept: "image/*,*/*" },
  })
  if (!res.ok) {
    throw new Error(`Failed to download image (${res.status})`)
  }
  const contentType = (res.headers.get("content-type") || "image/jpeg")
    .split(";")[0]
    .trim()
  if (!contentType.startsWith("image/")) {
    throw new Error(
      `URL did not return an image (got ${contentType}). Use a direct photo URL, not a gallery HTML page.`
    )
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  const ext = extFromContentType(contentType, source)
  return { buffer, contentType, originalName: `remote.${ext}` }
}

export async function attachProductImages(
  uid: string,
  input: {
    query: string
    imageUrls: string[]
    tags?: string[]
  }
): Promise<
  | {
      ok: true
      productId: string
      added: number
      totalImages: number
      urls: string[]
      skipped?: string[]
    }
  | { ok: false; error: string }
> {
  const { listProductsByUser } = await import(
    "@/lib/server/repositories/products.repository"
  )
  const { matchOwnedProduct } = await import(
    "@/lib/utils/match-owned-product"
  )

  const products = await listProductsByUser(uid)
  const product =
    products.find((p) => p.id === input.query.trim()) ||
    matchOwnedProduct(products, input.query)
  if (!product?.id) {
    return { ok: false, error: "Product not found" }
  }
  if (product.userId !== uid) {
    return { ok: false, error: "Product not found" }
  }

  const sources = (input.imageUrls || [])
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, MAX_ATTACH)
  if (sources.length === 0) {
    return {
      ok: false,
      error:
        "imageUrls required — pass direct https image URLs (or data:image;base64). Gallery HTML pages will fail.",
    }
  }

  const existing = normalizeProductImages(product.images)
  const added: ProductImageEntry[] = []
  const skipped: string[] = []
  const tags = (input.tags || [])
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10)

  for (const source of sources) {
    try {
      const { buffer, contentType, originalName } = await bufferFromSource(source)
      const url = await uploadUserAsset({
        buffer,
        contentType,
        originalName,
        userId: uid,
        kind: "images",
        productId: product.id,
      })
      added.push(tags.length ? { url, tags } : { url })
    } catch (e) {
      skipped.push(
        `${source.slice(0, 80)}… → ${e instanceof Error ? e.message : "failed"}`
      )
    }
  }

  if (added.length === 0) {
    return {
      ok: false,
      error:
        skipped[0] ||
        "No images attached. Use direct image file URLs, not Apple/gallery product pages.",
    }
  }

  const merged = [...existing, ...added]
  await updateProductDoc(product.id, { images: merged })

  // Refresh to confirm
  const fresh = await getProductById(product.id)
  const total = normalizeProductImages(fresh?.images).length

  return {
    ok: true,
    productId: product.id,
    added: added.length,
    totalImages: total,
    urls: added.map((a) => a.url),
    ...(skipped.length ? { skipped } : {}),
  }
}
