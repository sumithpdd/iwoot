import { NextResponse } from "next/server"
import {
  getAuthContext,
  getUidFromRequest,
  unauthorized,
  forbidden,
  badRequest,
  serverError,
} from "@/lib/server/require-auth"
import * as repo from "@/lib/server/repositories/want-baskets.repository"
import { upsertWantBasket } from "@/lib/server/resale/want-research"
import type { BuyingStage } from "@/lib/types/want-research"

export const runtime = "nodejs"

type Ctx = { params: { id: string } }

export async function GET(request: Request, context: Ctx) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const basket = await repo.getWantBasketById(context.params.id)
  if (!basket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (basket.userId !== uid) return forbidden()
  return NextResponse.json(basket)
}

export async function PATCH(request: Request, context: Ctx) {
  const auth = await getAuthContext(request)
  if (!auth) return unauthorized()

  const existing = await repo.getWantBasketById(context.params.id)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (existing.userId !== auth.uid) return forbidden()

  let body: {
    title?: string
    blurb?: string
    buyingStage?: BuyingStage
    targetTotalGbp?: number | null
    currencyNote?: string
    researchSummary?: string
  }
  try {
    body = await request.json()
  } catch {
    return badRequest("Invalid JSON body")
  }

  const result = await upsertWantBasket(auth.uid, {
    basketId: context.params.id,
    title: body.title?.trim() || existing.title,
    blurb: body.blurb,
    buyingStage: body.buyingStage,
    targetTotalGbp: body.targetTotalGbp,
    currencyNote: body.currencyNote,
    researchSummary: body.researchSummary,
  })
  if (!result.ok) return badRequest(result.error)
  return NextResponse.json({ ok: true, id: result.basketId })
}

export async function DELETE(request: Request, context: Ctx) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const existing = await repo.getWantBasketById(context.params.id)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (existing.userId !== uid) return forbidden()

  try {
    await repo.deleteWantBasketDoc(context.params.id)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return serverError(e instanceof Error ? e.message : "Delete failed")
  }
}
