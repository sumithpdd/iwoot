import type { Brand } from "@/lib/types/brand"

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateBrand(
  brand: Omit<Brand, "id" | "createdAt" | "updatedAt">
): ValidationResult {
  const errors: string[] = []
  if (!brand.name?.trim()) errors.push("Brand name is required")
  if (brand.website?.trim() && !isValidUrl(brand.website.trim())) {
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
  if (updates.website !== undefined && updates.website?.trim() && !isValidUrl(updates.website.trim())) {
    errors.push("Website must be a valid URL")
  }
  return { valid: errors.length === 0, errors }
}
