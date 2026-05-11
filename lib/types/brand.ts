/**
 * User-scoped brand profile (e.g. Apple, Sony) — normalises product `brand` + optional link.
 */
export interface Brand {
  id?: string
  userId: string
  name: string
  website?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
  createdByEmail?: string
  updatedByEmail?: string
}
