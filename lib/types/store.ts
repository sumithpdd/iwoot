/**
 * Saved retailer / purchase location profile (user-scoped).
 */
export interface Store {
  id?: string
  userId: string
  name: string
  website?: string
  address?: string
  phone?: string
  notes?: string
  /** Receipt document IDs that contributed to this profile */
  linkedReceiptIds?: string[]
  createdAt?: string
  updatedAt?: string
  createdByEmail?: string
  updatedByEmail?: string
}
