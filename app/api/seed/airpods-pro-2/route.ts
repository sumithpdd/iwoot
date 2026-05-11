import { NextResponse } from "next/server"
import { getAuthContext, unauthorized, badRequest } from "@/lib/server/require-auth"
import * as productsRepo from "@/lib/server/repositories/products.repository"
import * as brandsRepo from "@/lib/server/repositories/brands.repository"
import { validateProduct } from "@/lib/validators/product.validator"
import type { Product } from "@/lib/types/product"
import { buildAirpodsPro2SeedHave } from "@/lib/data/airpods-pro-2-seed-product"

/**
 * Creates an “Apple” brand profile (if missing) and one seeded Have product for AirPods Pro 2.
 */
export async function POST(request: Request) {
  const auth = await getAuthContext(request)
  if (!auth) return unauthorized()

  let withListingPlatforms = true
  try {
    const url = new URL(request.url)
    if (url.searchParams.get("listing") === "0") withListingPlatforms = false
  } catch {
    // ignore
  }

  const audit =
    auth.email !== undefined && auth.email !== ""
      ? { createdByEmail: auth.email, updatedByEmail: auth.email }
      : {}

  let existing = await brandsRepo.findBrandByNameForUser(auth.uid, "Apple")
  let brandId: string | null = null
  if (!existing) {
    brandId = await brandsRepo.createBrandDoc({
      userId: auth.uid,
      name: "Apple",
      website: "https://www.apple.com/uk/",
      notes: "Seeded for AirPods Pro 2 demo",
      ...audit,
    })
  } else {
    brandId = existing.id ?? null
  }

  const base = buildAirpodsPro2SeedHave({
    userId: auth.uid,
    brandId,
    withListingPlatforms,
  })

  const productData: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
    ...base,
    ...audit,
  }

  const validation = validateProduct(productData)
  if (!validation.valid) {
    return badRequest(validation.errors.join(", "))
  }

  const productId = await productsRepo.createProductDoc(productData)

  return NextResponse.json({
    ok: true,
    productId,
    brandId,
    reusedExistingAppleBrand: Boolean(existing),
  })
}
