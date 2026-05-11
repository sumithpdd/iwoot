import * as brandsRepo from "@/lib/server/repositories/brands.repository"

export type VerifyBrandResult =
  | { ok: true; normalizedId: string | undefined }
  | { ok: false; message: string }

export async function verifyBrandIdForUser(
  uid: string,
  brandId: unknown
): Promise<VerifyBrandResult> {
  if (brandId === undefined || brandId === null || brandId === "") {
    return { ok: true, normalizedId: undefined }
  }
  if (typeof brandId !== "string" || !brandId.trim()) {
    return { ok: false, message: "Invalid brand ID" }
  }
  const id = brandId.trim()
  const b = await brandsRepo.getBrandById(id)
  if (!b || b.userId !== uid) {
    return { ok: false, message: "Brand not found or not allowed" }
  }
  return { ok: true, normalizedId: id }
}
