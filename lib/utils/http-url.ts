/** Absolute URL (http, https, or other schemes `new URL` accepts). */
export function isAbsoluteUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

/** Files served from `public/{folder}/…` (no `..`). */
export function isPublicAssetPath(
  src: string,
  folder: "catalog" | "receipts"
): boolean {
  const prefix = `/${folder}/`
  return src.startsWith(prefix) && src.length < 500 && !src.includes("..")
}

export function isCatalogOrHttpAsset(src: string): boolean {
  return isPublicAssetPath(src, "catalog") || isAbsoluteUrl(src)
}

export function isReceiptOrHttpAsset(src: string): boolean {
  return isPublicAssetPath(src, "receipts") || isAbsoluteUrl(src)
}
