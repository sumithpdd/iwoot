import { NextResponse } from "next/server"
import {
  getAuthContext,
  getUidFromRequest,
  unauthorized,
  badRequest,
} from "@/lib/server/require-auth"
import * as repo from "@/lib/server/repositories/products.repository"
import { validateProduct } from "@/lib/validators/product.validator"
import { Product, ProductType } from "@/lib/types/product"
import { coerceProductImagesForPersist } from "@/lib/utils/product-images"
import { verifyStoreIdForUser } from "@/lib/server/verify-user-store"
import { verifyBrandIdForUser } from "@/lib/server/verify-user-brand"
import { isClientEntityId } from "@/lib/utils/client-entity-id"

export async function GET(request: Request) {
  const uid = await getUidFromRequest(request)
  if (!uid) return unauthorized()

  const { searchParams } = new URL(request.url)
  const typeParam = searchParams.get("type")
  const type =
    typeParam === "want" || typeParam === "have"
      ? (typeParam as ProductType)
      : undefined

  const products = await repo.listProductsByUser(uid, type)
  return NextResponse.json(products)
}

const SERVER_ONLY_PRODUCT_KEYS = [
  "id",
  "userId",
  "createdAt",
  "updatedAt",
  "createdByEmail",
  "updatedByEmail",
] as const

export async function POST(request: Request) {
  const auth = await getAuthContext(request)
  if (!auth) return unauthorized()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Invalid JSON body")
  }

  const clientId =
    typeof body.clientId === "string" ? body.clientId.trim() : ""
  delete body.clientId

  for (const key of SERVER_ONLY_PRODUCT_KEYS) {
    delete body[key]
  }

  const audit =
    auth.email !== undefined && auth.email !== ""
      ? { createdByEmail: auth.email, updatedByEmail: auth.email }
      : {}

  const productData = {
    ...body,
    ...audit,
    userId: auth.uid,
  } as Omit<Product, "id" | "createdAt" | "updatedAt"> & Record<string, unknown>

  if ("images" in productData) {
    const raw = productData.images
    if (raw === null || (Array.isArray(raw) && raw.length === 0)) {
      delete productData.images
    } else {
      const coerced = coerceProductImagesForPersist(raw)
      if (coerced === undefined) delete productData.images
      else productData.images = coerced
    }
  }

  const pd = productData as Record<string, unknown>
  if (pd.type !== "have") {
    delete pd.storeId
  } else if ("storeId" in pd) {
    if (pd.storeId === null) {
      delete pd.storeId
    } else {
      const chk = await verifyStoreIdForUser(auth.uid, pd.storeId)
      if (!chk.ok) return badRequest(chk.message)
      if (chk.normalizedId) pd.storeId = chk.normalizedId
      else delete pd.storeId
    }
  }

  if ("brandId" in pd) {
    if (pd.brandId === null) {
      delete pd.brandId
    } else {
      const chk = await verifyBrandIdForUser(auth.uid, pd.brandId)
      if (!chk.ok) return badRequest(chk.message)
      if (chk.normalizedId) pd.brandId = chk.normalizedId
      else delete pd.brandId
    }
  }

  const validation = validateProduct(productData as Omit<Product, "id" | "createdAt" | "updatedAt">)
  if (!validation.valid) {
    return badRequest(validation.errors.join(", "))
  }

  if (clientId) {
    if (!isClientEntityId(clientId)) {
      return badRequest("Invalid clientId")
    }
    const existing = await repo.getProductById(clientId)
    if (existing) {
      return badRequest("Product id already exists")
    }
    const id = await repo.createProductDocWithId(clientId, productData)
    return NextResponse.json({ id })
  }

  const id = await repo.createProductDoc(productData)
  return NextResponse.json({ id })
}
