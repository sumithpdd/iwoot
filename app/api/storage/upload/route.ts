import { NextResponse } from "next/server"
import { getUidFromRequest, unauthorized, badRequest } from "@/lib/server/require-auth"
import { uploadImageBuffer } from "@/lib/server/storage-admin"

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

  if (!(file instanceof Blob) || typeof folder !== "string") {
    return badRequest("file and folder are required")
  }

  if (folder !== "products" && folder !== "receipts") {
    return badRequest("Invalid folder")
  }

  const name =
    file instanceof File && file.name
      ? file.name
      : "upload.bin"

  const buffer = Buffer.from(await file.arrayBuffer())
  const contentType = file.type || "application/octet-stream"

  try {
    const url = await uploadImageBuffer({
      buffer,
      contentType,
      originalName: name,
      userId: uid,
      folder,
    })
    return NextResponse.json({ url })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Upload failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
