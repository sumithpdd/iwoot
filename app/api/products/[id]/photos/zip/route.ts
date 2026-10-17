import { NextResponse } from "next/server"
import JSZip from "jszip"
import {
  getUidFromRequest,
  unauthorized,
  forbidden,
  badRequest,
} from "@/lib/server/require-auth"
import * as repo from "@/lib/server/repositories/products.repository"
import { normalizeProductImages } from "@/lib/utils/product-images"
import {
  downloadImageBuffer,
  storagePathFromDownloadUrl,
  storagePathOwnedByUser,
} from "@/lib/server/storage-admin"

type Ctx = { params: { id: string } }

function slugifyName(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return s.slice(0, 60) || "product"
}

function urlAllowedForUser(
  url: string,
  userId: string,
  productUrls: Set<string>
): boolean {
  if (productUrls.has(url)) return true
  try {
    const path = storagePathFromDownloadUrl(url)
    return storagePathOwnedByUser(path, userId)
  } catch {
    return false
  }
}

async function buildZipResponse(params: {
  uid: string
  productName: string
  images: { url: string; tags?: string[] }[]
}) {
  const { uid, productName, images } = params
  if (images.length === 0) {
    return NextResponse.json({ error: "No photos on this product" }, { status: 400 })
  }

  const zip = new JSZip()
  const base = slugifyName(productName)
  const errors: string[] = []

  for (let i = 0; i < images.length; i++) {
    const entry = images[i]
    try {
      const { buffer, ext } = await downloadImageBuffer(entry.url, uid)
      const tag = entry.tags?.[0]?.replace(/[^a-zA-Z0-9_-]/g, "") || ""
      const fileName = tag
        ? `${base}-${String(i + 1).padStart(2, "0")}-${tag}.${ext}`
        : `${base}-${String(i + 1).padStart(2, "0")}.${ext}`
      zip.file(fileName, buffer)
    } catch (e) {
      errors.push(`photo ${i + 1}: ${e instanceof Error ? e.message : "failed"}`)
    }
  }

  const files = Object.keys(zip.files).filter((k) => !zip.files[k].dir)
  if (files.length === 0) {
    return NextResponse.json(
      { error: "Could not download any photos", details: errors },
      { status: 502 }
    )
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  })

  const filename = `${base}-photos.zip`
  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}

export async function GET(request: Request, context: Ctx) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const { id } = context.params
  const product = await repo.getProductById(id)
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (product.userId !== uid) return forbidden()

  return buildZipResponse({
    uid,
    productName: product.name,
    images: normalizeProductImages(product.images),
  })
}

/** Optional body `{ images: { url, tags? }[] }` to include newly uploaded (not yet saved) photos. */
export async function POST(request: Request, context: Ctx) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const { id } = context.params
  const product = await repo.getProductById(id)
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (product.userId !== uid) return forbidden()

  const saved = normalizeProductImages(product.images)
  const productUrls = new Set(saved.map((i) => i.url))

  let images = saved
  try {
    const body = (await request.json()) as {
      images?: { url?: string; tags?: string[] }[]
    }
    if (Array.isArray(body.images) && body.images.length > 0) {
      const requested = body.images
        .filter((i) => typeof i?.url === "string" && i.url.trim())
        .map((i) => ({
          url: i.url!.trim(),
          tags: Array.isArray(i.tags) ? i.tags : undefined,
        }))
      const denied = requested.filter((i) => !urlAllowedForUser(i.url, uid, productUrls))
      if (denied.length > 0) {
        return badRequest("One or more photo URLs are not allowed")
      }
      images = requested
    }
  } catch {
    // empty / invalid body → use saved product images
  }

  return buildZipResponse({
    uid,
    productName: product.name,
    images,
  })
}
