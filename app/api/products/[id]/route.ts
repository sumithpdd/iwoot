import { NextResponse } from "next/server"
import {
  getAuthContext,
  getUidFromRequest,
  unauthorized,
  forbidden,
  badRequest,
  serverError,
} from "@/lib/server/require-auth"
import * as repo from "@/lib/server/repositories/products.repository"
import { validateProductUpdate } from "@/lib/validators/product.validator"
import { Product } from "@/lib/types/product"
import { coerceProductImagesForPersist } from "@/lib/utils/product-images"
import { verifyStoreIdForUser } from "@/lib/server/verify-user-store"
import { verifyBrandIdForUser } from "@/lib/server/verify-user-brand"

type Ctx = { params: { id: string } }

export async function GET(request: Request, context: Ctx) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const { id } = context.params
  const product = await repo.getProductById(id)
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (product.userId !== uid) return forbidden()
  return NextResponse.json(product)
}

const PATCH_STRIP_KEYS = [
  "userId",
  "id",
  "createdAt",
  "updatedAt",
  "createdByEmail",
  "updatedByEmail",
] as const

export async function PATCH(request: Request, context: Ctx) {
  const auth = await getAuthContext(request)
  if (!auth) return unauthorized()

  const { id } = context.params
  const existing = await repo.getProductById(id)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (existing.userId !== auth.uid) return forbidden()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Invalid JSON body")
  }

  for (const key of PATCH_STRIP_KEYS) {
    delete body[key]
  }

  if ("images" in body) {
    const raw = body.images
    if (raw === null || (Array.isArray(raw) && raw.length === 0)) {
      body.images = []
    } else {
      body.images = coerceProductImagesForPersist(raw) ?? []
    }
  }

  if (existing.type !== "have") {
    delete body.storeId
  } else if ("storeId" in body) {
    const raw = body.storeId
    if (raw === null || raw === "") {
      body.storeId = null
    } else {
      const chk = await verifyStoreIdForUser(auth.uid, raw)
      if (!chk.ok) return badRequest(chk.message)
      body.storeId = chk.normalizedId
    }
  }

  if ("brandId" in body) {
    const raw = body.brandId
    if (raw === null || raw === "") {
      body.brandId = null
    } else {
      const chk = await verifyBrandIdForUser(auth.uid, raw)
      if (!chk.ok) return badRequest(chk.message)
      body.brandId = chk.normalizedId
    }
  }

  const validation = validateProductUpdate(body as Partial<Product>)
  if (!validation.valid) {
    return badRequest(validation.errors.join(", "))
  }

  const updates: Record<string, unknown> = { ...body }
  if (auth.email !== undefined && auth.email !== "") {
    updates.updatedByEmail = auth.email
  }

  try {
    await repo.updateProductDoc(id, updates)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Update failed"
    return serverError(msg)
  }
}

export async function DELETE(request: Request, context: Ctx) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const { id } = context.params
  const existing = await repo.getProductById(id)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (existing.userId !== uid) return forbidden()

  await repo.deleteProductDoc(id)
  return NextResponse.json({ ok: true })
}
