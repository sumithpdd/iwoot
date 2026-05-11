import { NextResponse } from "next/server"
import {
  getUidFromRequest,
  unauthorized,
  badRequest,
} from "@/lib/server/require-auth"
import * as repo from "@/lib/server/repositories/receipts.repository"
import * as storesRepo from "@/lib/server/repositories/stores.repository"
import { validateReceipt } from "@/lib/validators/receipt.validator"
import { Receipt } from "@/lib/types/receipt"

export async function GET(request: Request) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const receipts = await repo.listReceiptsByUser(uid)
  return NextResponse.json(receipts)
}

export async function POST(request: Request) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Invalid JSON body")
  }

  const receiptData = {
    ...body,
    userId: uid,
  } as Omit<Receipt, "id" | "createdAt" | "updatedAt">

  if ((receiptData as { storeId?: unknown }).storeId === null) {
    delete (receiptData as { storeId?: unknown }).storeId
  }

  if (typeof (receiptData as { storeId?: unknown }).storeId === "string") {
    const sid = (receiptData as { storeId: string }).storeId.trim()
    if (sid) {
      const s = await storesRepo.getStoreById(sid)
      if (!s || s.userId !== uid) {
        return badRequest("Invalid store reference")
      }
      ;(receiptData as { storeId: string }).storeId = sid
    } else {
      delete (receiptData as { storeId?: string }).storeId
    }
  }

  const validation = validateReceipt(receiptData)
  if (!validation.valid) {
    return badRequest(validation.errors.join(", "))
  }

  const id = await repo.createReceiptDoc(receiptData)
  return NextResponse.json({ id })
}
