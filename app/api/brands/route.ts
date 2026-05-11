import { NextResponse } from "next/server"
import {
  getAuthContext,
  getUidFromRequest,
  unauthorized,
  badRequest,
} from "@/lib/server/require-auth"
import * as repo from "@/lib/server/repositories/brands.repository"
import { validateBrand } from "@/lib/validators/brand.validator"
import type { Brand } from "@/lib/types/brand"

const SERVER_ONLY = [
  "id",
  "userId",
  "createdAt",
  "updatedAt",
  "createdByEmail",
  "updatedByEmail",
] as const

export async function GET(request: Request) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const brands = await repo.listBrandsByUser(uid)
  return NextResponse.json(brands)
}

export async function POST(request: Request) {
  const auth = await getAuthContext(request)
  if (!auth) return unauthorized()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Invalid JSON body")
  }

  for (const key of SERVER_ONLY) {
    delete body[key]
  }

  const audit =
    auth.email !== undefined && auth.email !== ""
      ? { createdByEmail: auth.email, updatedByEmail: auth.email }
      : {}

  const brandData = {
    ...body,
    ...audit,
    userId: auth.uid,
  } as Omit<Brand, "id" | "createdAt" | "updatedAt">

  const validation = validateBrand(brandData)
  if (!validation.valid) {
    return badRequest(validation.errors.join(", "))
  }

  const id = await repo.createBrandDoc(brandData)
  return NextResponse.json({ id })
}
