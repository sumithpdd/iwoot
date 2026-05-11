import { NextResponse } from "next/server"
import {
  getUidFromRequest,
  unauthorized,
  forbidden,
  badRequest,
} from "@/lib/server/require-auth"
import * as repo from "@/lib/server/repositories/products.repository"

type Ctx = { params: { id: string } }

export async function POST(request: Request, context: Ctx) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const { id } = context.params
  const product = await repo.getProductById(id)
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (product.userId !== uid) return forbidden()

  let body: { price?: number; website?: string; notes?: string }
  try {
    body = await request.json()
  } catch {
    return badRequest("Invalid JSON body")
  }

  const price = body.price
  if (typeof price !== "number" || price <= 0) {
    return badRequest("Valid price is required")
  }

  const website =
    typeof body.website === "string" && body.website.length > 0
      ? body.website
      : "Unknown Store"

  await repo.addPriceHistoryEntry(
    id,
    price,
    website,
    typeof body.notes === "string" ? body.notes : undefined
  )

  return NextResponse.json({ ok: true })
}
