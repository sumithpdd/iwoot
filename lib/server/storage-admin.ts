import { randomUUID } from "crypto"
import { getAdminBucket } from "@/lib/server/firebase-admin"
import { safeStorageId } from "@/lib/utils/client-entity-id"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_PDF_BYTES = 10 * 1024 * 1024

export type UserAssetKind = "images" | "receipts"

function assertAllowedFile(contentType: string, buffer: Buffer, kind: UserAssetKind) {
  const isPdf = contentType === "application/pdf"
  const isImage = contentType.startsWith("image/")
  if (kind === "images" && !isImage) {
    throw new Error("File must be an image")
  }
  if (kind === "receipts" && !isImage && !isPdf) {
    throw new Error("Receipt file must be an image or PDF")
  }
  const max = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES
  if (buffer.length > max) {
    throw new Error(isPdf ? "PDF must be less than 10MB" : "Image size must be less than 5MB")
  }
}

function objectPath(params: {
  userId: string
  kind: UserAssetKind
  originalName: string
  productId?: string
  receiptId?: string
}): string {
  const userId = safeStorageId(params.userId)
  const safeName = params.originalName.replace(/[^a-zA-Z0-9.-]/g, "_")
  const fileName = `${Date.now()}-${safeName}`
  if (params.productId) {
    const productId = safeStorageId(params.productId)
    return `users/${userId}/products/${productId}/${params.kind}/${fileName}`
  }
  if (params.receiptId) {
    const receiptId = safeStorageId(params.receiptId)
    return `users/${userId}/receipts/${receiptId}/${fileName}`
  }
  throw new Error("productId or receiptId is required")
}

function publicDownloadUrl(bucketName: string, path: string, token: string): string {
  const encoded = encodeURIComponent(path)
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`
}

export async function uploadUserAsset(params: {
  buffer: Buffer
  contentType: string
  originalName: string
  userId: string
  kind: UserAssetKind
  productId?: string
  receiptId?: string
}): Promise<string> {
  const { buffer, contentType, originalName, userId, kind, productId, receiptId } = params
  assertAllowedFile(contentType, buffer, kind)
  if (!productId && !receiptId) {
    throw new Error("productId or receiptId is required")
  }

  const path = objectPath({
    userId,
    kind,
    originalName,
    productId,
    receiptId,
  })
  const bucket = getAdminBucket()
  const file = bucket.file(path)
  const downloadToken = randomUUID()

  await file.save(buffer, {
    metadata: {
      contentType,
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  })

  return publicDownloadUrl(bucket.name, path, downloadToken)
}

/** @deprecated Use uploadUserAsset — kept for a short transition */
export async function uploadImageBuffer(params: {
  buffer: Buffer
  contentType: string
  originalName: string
  userId: string
  folder: "products" | "receipts"
  productId?: string
  receiptId?: string
}): Promise<string> {
  return uploadUserAsset({
    buffer: params.buffer,
    contentType: params.contentType,
    originalName: params.originalName,
    userId: params.userId,
    kind: params.folder === "receipts" ? "receipts" : "images",
    productId: params.productId,
    receiptId: params.receiptId,
  })
}

export function storagePathFromDownloadUrl(imageUrl: string): string {
  const url = new URL(imageUrl)
  const marker = "/o/"
  const idx = url.pathname.indexOf(marker)
  if (idx === -1) {
    throw new Error("Invalid image URL format")
  }
  return decodeURIComponent(url.pathname.slice(idx + marker.length))
}

export function storagePathOwnedByUser(path: string, userId: string): boolean {
  return (
    path.startsWith(`users/${userId}/`) ||
    path.startsWith(`products/${userId}/`) ||
    path.startsWith(`receipts/${userId}/`)
  )
}

export async function deleteImageByUrl(imageUrl: string): Promise<void> {
  const decodedPath = storagePathFromDownloadUrl(imageUrl)
  const bucket = getAdminBucket()
  await bucket.file(decodedPath).delete({ ignoreNotFound: true })
}

function extFromContentType(contentType: string | undefined, fallbackUrl: string): string {
  const ct = (contentType || "").toLowerCase()
  if (ct.includes("png")) return "png"
  if (ct.includes("webp")) return "webp"
  if (ct.includes("gif")) return "gif"
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg"
  const path = fallbackUrl.split("?")[0] || ""
  const m = path.match(/\.(png|jpe?g|webp|gif)$/i)
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg"
}

/** Load image bytes from Storage (preferred) or HTTP for external URLs. */
export async function downloadImageBuffer(
  imageUrl: string,
  userId: string
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  try {
    const path = storagePathFromDownloadUrl(imageUrl)
    if (storagePathOwnedByUser(path, userId)) {
      const bucket = getAdminBucket()
      const file = bucket.file(path)
      const [buffer] = await file.download()
      const [meta] = await file.getMetadata()
      const contentType = String(meta.contentType || "image/jpeg")
      return {
        buffer,
        contentType,
        ext: extFromContentType(contentType, imageUrl),
      }
    }
  } catch {
    // fall through to HTTP fetch (lookup / external URLs)
  }

  const res = await fetch(imageUrl)
  if (!res.ok) {
    throw new Error(`Failed to download image (${res.status})`)
  }
  const contentType = res.headers.get("content-type") || "image/jpeg"
  const buffer = Buffer.from(await res.arrayBuffer())
  return {
    buffer,
    contentType,
    ext: extFromContentType(contentType, imageUrl),
  }
}
