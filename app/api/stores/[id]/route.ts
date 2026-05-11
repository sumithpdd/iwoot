import { NextResponse } from "next/server"
import {
  getAuthContext,
  getUidFromRequest,
  unauthorized,
  forbidden,
  badRequest,
  serverError,
} from "@/lib/server/require-auth"
import * as repo from "@/lib/server/repositories/stores.repository"
import { validateStoreUpdate } from "@/lib/validators/store.validator"
import { Store } from "@/lib/types/store"

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
  const store = await repo.getStoreById(id)
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (store.userId !== uid) return forbidden()
  return NextResponse.json(store)
}

export async function PATCH(request: Request, context: Ctx) {
  const auth = await getAuthContext(request)
  if (!auth) return unauthorized()

  const { id } = context.params
  const existing = await repo.getStoreById(id)
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

  const validation = validateStoreUpdate(body as Partial<Store>)
  if (!validation.valid) {
    return badRequest(validation.errors.join(", "))
  }

  const updates: Record<string, unknown> = { ...body }
  if (auth.email !== undefined && auth.email !== "") {
    updates.updatedByEmail = auth.email
  }

  try {
    await repo.updateStoreDoc(id, updates)
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
  const existing = await repo.getStoreById(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.userId !== uid) return forbidden()

  await repo.deleteStoreDoc(id)
  return NextResponse.json({ ok: true })
}
