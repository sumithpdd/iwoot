export type VerifyOwnedIdResult =
  | { ok: true; normalizedId: string | undefined }
  | { ok: false; message: string }

/**
 * Optional FK to a user-owned Firestore doc (store, brand, …).
 * Empty / null clears the link. Non-empty ids must exist and match `uid`.
 */
export async function verifyOwnedIdForUser(
  uid: string,
  rawId: unknown,
  load: (id: string) => Promise<{ userId: string } | null>,
  labels: { invalid: string; forbidden: string }
): Promise<VerifyOwnedIdResult> {
  if (rawId === undefined || rawId === null || rawId === "") {
    return { ok: true, normalizedId: undefined }
  }
  if (typeof rawId !== "string" || !rawId.trim()) {
    return { ok: false, message: labels.invalid }
  }
  const id = rawId.trim()
  const doc = await load(id)
  if (!doc || doc.userId !== uid) {
    return { ok: false, message: labels.forbidden }
  }
  return { ok: true, normalizedId: id }
}
