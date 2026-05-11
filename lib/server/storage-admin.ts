import { randomUUID } from "crypto"
import { getAdminBucket } from "@/lib/server/firebase-admin"

const MAX_BYTES = 5 * 1024 * 1024

export async function uploadImageBuffer(params: {
  buffer: Buffer
  contentType: string
  originalName: string
  userId: string
  folder: "products" | "receipts"
}): Promise<string> {
  const { buffer, contentType, originalName, userId, folder } = params

  if (!contentType.startsWith("image/")) {
    throw new Error("File must be an image")
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("Image size must be less than 5MB")
  }

  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_")
  const path = `${folder}/${userId}/${Date.now()}-${safeName}`
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

  const bucketName = bucket.name
  const encoded = encodeURIComponent(path)
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${downloadToken}`
}

export async function deleteImageByUrl(imageUrl: string): Promise<void> {
  const url = new URL(imageUrl)
  const pathMatch = url.pathname.match(/\/o\/(.+)\?/)
  if (!pathMatch) {
    throw new Error("Invalid image URL format")
  }
  const decodedPath = decodeURIComponent(pathMatch[1])
  const bucket = getAdminBucket()
  await bucket.file(decodedPath).delete({ ignoreNotFound: true })
}
