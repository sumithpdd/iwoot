import * as brandsRepo from "@/lib/server/repositories/brands.repository"
import {
  verifyOwnedIdForUser,
  type VerifyOwnedIdResult,
} from "@/lib/server/verify-owned-id"

export type VerifyBrandResult = VerifyOwnedIdResult

export async function verifyBrandIdForUser(
  uid: string,
  brandId: unknown
): Promise<VerifyBrandResult> {
  return verifyOwnedIdForUser(uid, brandId, brandsRepo.getBrandById, {
    invalid: "Invalid brand ID",
    forbidden: "Brand not found or not allowed",
  })
}
