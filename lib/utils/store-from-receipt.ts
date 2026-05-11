import type { Receipt } from "@/lib/types/receipt"
import type { Store } from "@/lib/types/store"

/** Prefill a new store from receipt fields (client or server). */
export function storeDraftFromReceipt(receipt: Receipt): Omit<
  Store,
  "id" | "userId" | "createdAt" | "updatedAt" | "createdByEmail" | "updatedByEmail"
> {
  return {
    name: receipt.storeName?.trim() || "Store",
    website: receipt.storeWebsite?.trim() || undefined,
    address: receipt.storeAddress?.trim() || undefined,
    linkedReceiptIds: receipt.id ? [receipt.id] : undefined,
  }
}
