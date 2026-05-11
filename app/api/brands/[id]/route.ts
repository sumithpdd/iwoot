import { NextResponse } from "next/server"
import {
  getAuthContext,
  getUidFromRequest,
  unauthorized,
  forbidden,
  badRequest,
  serverError,
} from "@/lib/server/require-auth"
import * as repo from "@/lib/server/repositories/brands.repository"
import { validateBrandUpdate } from "@/lib/validators/brand.validator"
import type { Brand } from "@/lib/types/brand"

type Ctx = { params: { id: string } }

const PATCH_STRIP = [
  "userId",
  "id",
  "createdAt",
  "updatedAt",
  "createdByEmail",
  "updatedByEmail",
] as const

export async function GET(request: Request, context: Ctx) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const { id } = context.params
  const brand = await repo.getBrandById(id)
  if (!brand) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (brand.userId !== uid) return forbidden()
  return NextResponse.json(brand)
}

export async function PATCH(request: Request, context: Ctx) {
  const auth = await getAuthContext(request)
  if (!auth) return unauthorized()

  const { id } = context.params
  const existing = await repo.getBrandById(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.userId !== auth.uid) return forbidden()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Invalid JSON body")
  }

  for (const key of PATCH_STRIP) {
    delete body[key]
  }

  const validation = validateBrandUpdate(body as Partial<Brand>)
  if (!validation.valid) {
    return badRequest(validation.errors.join(", "))
  }

  const updates: Record<string, unknown> = { ...body }
  if (auth.email !== undefined && auth.email !== "") {
    updates.updatedByEmail = auth.email
  }

  try {
    await repo.updateBrandDoc(id, updates)
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
  const existing = await repo.getBrandById(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.userId !== uid) return forbidden()

  await repo.deleteBrandDoc(id)
  return NextResponse.json({ ok: true })
}
