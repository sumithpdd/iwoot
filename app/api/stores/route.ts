import { NextResponse } from "next/server"
import {
  getAuthContext,
  getUidFromRequest,
  unauthorized,
  badRequest,
} from "@/lib/server/require-auth"
import * as repo from "@/lib/server/repositories/stores.repository"
import { validateStore } from "@/lib/validators/store.validator"
import { Store } from "@/lib/types/store"

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

  const stores = await repo.listStoresByUser(uid)
  return NextResponse.json(stores)
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

  const storeData = {
    ...body,
    ...audit,
    userId: auth.uid,
  } as Omit<Store, "id" | "createdAt" | "updatedAt">

  const validation = validateStore(storeData)
  if (!validation.valid) {
    return badRequest(validation.errors.join(", "))
  }

  const id = await repo.createStoreDoc(storeData)
  return NextResponse.json({ id })
}
