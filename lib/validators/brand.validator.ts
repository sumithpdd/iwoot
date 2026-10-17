import type { Brand } from "@/lib/types/brand"
import { isAbsoluteUrl } from "@/lib/utils/http-url"
import type { ValidationResult } from "@/lib/validators/result"

export type { ValidationResult }

export function validateBrand(
  brand: Omit<Brand, "id" | "createdAt" | "updatedAt">
): ValidationResult {
  const errors: string[] = []
  if (!brand.name?.trim()) errors.push("Brand name is required")
  if (brand.website?.trim() && !isAbsoluteUrl(brand.website.trim())) {
    errors.push("Website must be a valid URL")
  }
  if (!brand.userId?.trim()) errors.push("User ID is required")
  return { valid: errors.length === 0, errors }
}

export function validateBrandUpdate(
  updates: Partial<Omit<Brand, "id" | "userId" | "createdAt">>
): ValidationResult {
  const errors: string[] = []
  if (updates.name !== undefined && !updates.name?.trim()) {
    errors.push("Brand name cannot be empty")
  }
  if (updates.website !== undefined && updates.website?.trim() && !isAbsoluteUrl(updates.website.trim())) {
    errors.push("Website must be a valid URL")
  }
  return { valid: errors.length === 0, errors }
}
