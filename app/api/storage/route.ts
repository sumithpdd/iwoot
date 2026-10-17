import { NextResponse } from "next/server"
import { getUidFromRequest, unauthorized, badRequest } from "@/lib/server/require-auth"
import {
  deleteImageByUrl,
  storagePathFromDownloadUrl,
  storagePathOwnedByUser,
} from "@/lib/server/storage-admin"

export async function DELETE(request: Request) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return badRequest("Invalid JSON body")
  }

  const url = body.url
  if (!url || typeof url !== "string") {
    return badRequest("url is required")
  }

  try {
    const path = storagePathFromDownloadUrl(url)
    if (!storagePathOwnedByUser(path, uid)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    await deleteImageByUrl(url)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Delete failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
