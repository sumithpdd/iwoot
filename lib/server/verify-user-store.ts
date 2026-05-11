import * as storesRepo from "@/lib/server/repositories/stores.repository"

export type VerifyStoreResult =
  | { ok: true; normalizedId: string | undefined }
  | { ok: false; message: string }

/**
 * Returns normalized store id, or `undefined` if cleared / absent.
 * Fails if a non-empty id does not exist or is not owned by `uid`.
 */
export async function verifyStoreIdForUser(
  uid: string,
  storeId: unknown
): Promise<VerifyStoreResult> {
  if (storeId === undefined || storeId === null || storeId === "") {
    return { ok: true, normalizedId: undefined }
  }
  if (typeof storeId !== "string" || !storeId.trim()) {
    return { ok: false, message: "Invalid store ID" }
  }
  const id = storeId.trim()
  const s = await storesRepo.getStoreById(id)
  if (!s || s.userId !== uid) {
    return { ok: false, message: "Store not found or not allowed" }
  }
  return { ok: true, normalizedId: id }
}
