import { NextResponse } from "next/server"
import {
  getAuthContext,
  getUidFromRequest,
  unauthorized,
  badRequest,
} from "@/lib/server/require-auth"
import * as repo from "@/lib/server/repositories/want-baskets.repository"
import { upsertWantBasket } from "@/lib/server/resale/want-research"
import type { BuyingStage } from "@/lib/types/want-research"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()
  const baskets = await repo.listWantBasketsByUser(uid)
  return NextResponse.json(baskets)
}

export async function POST(request: Request) {
  const auth = await getAuthContext(request)
  if (!auth) return unauthorized()

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

  if (!body.title?.trim()) return badRequest("title is required")

  const result = await upsertWantBasket(auth.uid, {
    title: body.title,
    blurb: body.blurb,
    buyingStage: body.buyingStage,
    targetTotalGbp: body.targetTotalGbp,
    currencyNote: body.currencyNote,
    researchSummary: body.researchSummary,
  })
  if (!result.ok) return badRequest(result.error)
  return NextResponse.json({ id: result.basketId })
}
