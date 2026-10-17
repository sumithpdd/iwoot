import { NextResponse } from "next/server"
import { getUidFromRequest, unauthorized, badRequest } from "@/lib/server/require-auth"
import { uploadUserAsset, type UserAssetKind } from "@/lib/server/storage-admin"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return badRequest("Expected multipart form data")
  }

  const file = formData.get("file")
  const folder = formData.get("folder")
  const productIdRaw = formData.get("productId")
  const receiptIdRaw = formData.get("receiptId")

  if (!(file instanceof Blob) || typeof folder !== "string") {
    return badRequest("file and folder are required")
  }

  const kind: UserAssetKind | null =
    folder === "receipts" ? "receipts" : folder === "products" ? "images" : null
  if (!kind) {
    return badRequest("Invalid folder")
  }

  const productId =
    typeof productIdRaw === "string" && productIdRaw.trim()
      ? productIdRaw.trim()
      : undefined
  const receiptId =
    typeof receiptIdRaw === "string" && receiptIdRaw.trim()
      ? receiptIdRaw.trim()
      : undefined

  if (!productId && !receiptId) {
    return badRequest("productId or receiptId is required")
  }

  const name =
    file instanceof File && file.name
      ? file.name
      : "upload.bin"

  const buffer = Buffer.from(await file.arrayBuffer())
  const contentType = file.type || "application/octet-stream"

  try {
    const url = await uploadUserAsset({
      buffer,
      contentType,
      originalName: name,
      userId: uid,
      kind,
      productId,
      receiptId,
    })
    return NextResponse.json({ url })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Upload failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
