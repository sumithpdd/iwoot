import { NextResponse } from "next/server"
import {
  getUidFromRequest,
  unauthorized,
  forbidden,
  badRequest,
  serverError,
} from "@/lib/server/require-auth"
import * as repo from "@/lib/server/repositories/receipts.repository"
import * as storesRepo from "@/lib/server/repositories/stores.repository"
import { validateReceiptUpdate } from "@/lib/validators/receipt.validator"
import { Receipt } from "@/lib/types/receipt"

type Ctx = { params: { id: string } }

export async function GET(request: Request, context: Ctx) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const { id } = context.params
  const receipt = await repo.getReceiptById(id)
  if (!receipt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (receipt.userId !== uid) return forbidden()
  return NextResponse.json(receipt)
}

export async function PATCH(request: Request, context: Ctx) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const { id } = context.params
  const existing = await repo.getReceiptById(id)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (existing.userId !== uid) return forbidden()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Invalid JSON body")
  }

  delete body.userId
  delete body.id

  if ("storeId" in body) {
    const raw = body.storeId
    if (raw === null || raw === "") {
      body.storeId = null
    } else if (typeof raw === "string" && raw.trim()) {
      const s = await storesRepo.getStoreById(raw.trim())
      if (!s || s.userId !== uid) {
        return badRequest("Invalid store reference")
      }
      body.storeId = raw.trim()
    }
  }

  const validation = validateReceiptUpdate(body as Partial<Receipt>)
  if (!validation.valid) {
    return badRequest(validation.errors.join(", "))
  }

  try {
    await repo.updateReceiptDoc(id, body)
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
  const existing = await repo.getReceiptById(id)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (existing.userId !== uid) return forbidden()

  await repo.deleteReceiptDoc(id)
  return NextResponse.json({ ok: true })
}
