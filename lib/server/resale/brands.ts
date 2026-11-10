/**
 * Brand profiles for MCP / chat — create and link to products.
 */

import {
  createBrandDoc,
  findBrandByNameForUser,
  getBrandById,
  listBrandsByUser,
  updateBrandDoc,
} from "@/lib/server/repositories/brands.repository"
import {
  getProductById,
  listProductsByUser,
  updateProductDoc,
} from "@/lib/server/repositories/products.repository"
import { matchOwnedProduct } from "@/lib/utils/match-owned-product"
import { isAbsoluteUrl } from "@/lib/utils/http-url"

export async function listBrands(uid: string) {
  const brands = await listBrandsByUser(uid)
  return {
    count: brands.length,
    brands: brands.map((b) => ({
      id: b.id,
      name: b.name,
      website: b.website ?? null,
      notes: b.notes ?? null,
    })),
  }
}

export async function upsertBrand(
  uid: string,
  input: {
    brandId?: string
    name: string
    website?: string
    notes?: string
  }
): Promise<
  | { ok: true; brandId: string; created: boolean; name: string }
  | { ok: false; error: string }
> {
  const name = input.name.trim()
  if (!name) return { ok: false, error: "name is required" }
  if (input.website && !isAbsoluteUrl(input.website)) {
    return { ok: false, error: "website must be a valid URL" }
  }

  if (input.brandId) {
    const existing = await getBrandById(input.brandId)
    if (!existing || existing.userId !== uid) {
      return { ok: false, error: "Brand not found" }
    }
    await updateBrandDoc(input.brandId, {
      name,
      website: input.website?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    return { ok: true, brandId: input.brandId, created: false, name }
  }

  const byName = await findBrandByNameForUser(uid, name)
  if (byName?.id) {
    await updateBrandDoc(byName.id, {
      name,
      ...(input.website !== undefined
        ? { website: input.website.trim() || null }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
    })
    return { ok: true, brandId: byName.id, created: false, name }
  }

  const brandId = await createBrandDoc({
    userId: uid,
    name,
    website: input.website?.trim(),
    notes: input.notes?.trim(),
  })
  return { ok: true, brandId, created: true, name }
}

/** Find or create a brand by display name; returns brandId. */
export async function ensureBrandId(
  uid: string,
  brandName: string,
  opts?: { website?: string }
): Promise<string | null> {
  const name = brandName.trim()
  if (!name) return null
  const existing = await findBrandByNameForUser(uid, name)
  if (existing?.id) return existing.id
  return createBrandDoc({
    userId: uid,
    name,
    website: opts?.website?.trim(),
  })
}

export async function attachBrandToProduct(
  uid: string,
  input: {
    query: string
    brandId?: string
    brandName?: string
    createIfMissing?: boolean
    website?: string
  }
): Promise<
  | {
      ok: true
      productId: string
      brandId: string
      brand: string
      createdBrand: boolean
    }
  | { ok: false; error: string }
> {
  const products = await listProductsByUser(uid)
  const product =
    products.find((p) => p.id === input.query.trim()) ||
    matchOwnedProduct(products, input.query)
  if (!product?.id || product.userId !== uid) {
    return { ok: false, error: "Product not found" }
  }

  let brandId = input.brandId?.trim() || ""
  let brandName = input.brandName?.trim() || ""
  let createdBrand = false

  if (brandId) {
    const b = await getBrandById(brandId)
    if (!b || b.userId !== uid) {
      return { ok: false, error: "Brand not found" }
    }
    brandName = b.name
  } else if (brandName) {
    const existing = await findBrandByNameForUser(uid, brandName)
    if (existing?.id) {
      brandId = existing.id
      brandName = existing.name
    } else if (input.createIfMissing !== false) {
      brandId = await createBrandDoc({
        userId: uid,
        name: brandName,
        website: input.website?.trim(),
      })
      createdBrand = true
    } else {
      return { ok: false, error: "Brand not found; pass createIfMissing true" }
    }
  } else {
    return { ok: false, error: "brandId or brandName is required" }
  }

  await updateProductDoc(product.id, {
    brand: brandName,
    brandId,
  })

  const fresh = await getProductById(product.id)
  return {
    ok: true,
    productId: product.id,
    brandId,
    brand: fresh?.brand || brandName,
    createdBrand,
  }
}
