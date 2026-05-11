import { NextResponse } from "next/server"
import {
  getUidFromRequest,
  unauthorized,
} from "@/lib/server/require-auth"
import * as repo from "@/lib/server/repositories/receipts.repository"

type Ctx = { params: { productId: string } }

export async function GET(request: Request, context: Ctx) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const { productId } = context.params
  const receipts = await repo.listReceiptsByProductForUser(uid, productId)
  return NextResponse.json(receipts)
}
