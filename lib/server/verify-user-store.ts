import * as storesRepo from "@/lib/server/repositories/stores.repository"
import {
  verifyOwnedIdForUser,
  type VerifyOwnedIdResult,
} from "@/lib/server/verify-owned-id"

export type VerifyStoreResult = VerifyOwnedIdResult

export async function verifyStoreIdForUser(
  uid: string,
  storeId: unknown
): Promise<VerifyStoreResult> {
  return verifyOwnedIdForUser(uid, storeId, storesRepo.getStoreById, {
    invalid: "Invalid store ID",
    forbidden: "Store not found or not allowed",
  })
}
