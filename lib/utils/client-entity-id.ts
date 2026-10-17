/** Client-generated ids so uploads can land under the product/receipt before the Firestore doc exists. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function newClientEntityId(): string {
  return crypto.randomUUID()
}

export function isClientEntityId(id: string): boolean {
  return UUID_RE.test(id.trim())
}

/** Storage object path segment (Firestore auto-ids and UUIDs). */
export function safeStorageId(id: string): string {
  const s = id.trim().replace(/[^a-zA-Z0-9._-]/g, "_")
  if (!s || s.includes("..")) {
    throw new Error("Invalid storage id")
  }
  return s.slice(0, 128)
}
