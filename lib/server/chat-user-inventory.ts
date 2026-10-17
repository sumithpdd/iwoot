import { listProductsByUser } from "@/lib/server/repositories/products.repository"
import { listStoresByUser } from "@/lib/server/repositories/stores.repository"
import type { HaveProduct, Product } from "@/lib/types/product"
import { htmlToPlainText } from "@/lib/utils/html-plain-text"
import { normalizeProductImages } from "@/lib/utils/product-images"
import { getListingPlatforms, getListingStatus } from "@/lib/utils/product-listing"

const MAX_NOTE = 180
const MAX_HISTORY = 4

function clip(value: string | undefined, max = MAX_NOTE): string | undefined {
  const t = value?.trim()
  if (!t) return undefined
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

function formatPriceHistory(product: Product): string | undefined {
  const history = product.priceHistory
  if (!history?.length) return undefined
  const latest = [...history]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, MAX_HISTORY)
  const parts = latest.map((h) => {
    const bits = [`${h.price}`]
    if (h.date) bits.push(h.date.slice(0, 10))
    if (h.website) bits.push(h.website)
    if (h.notes) bits.push(clip(h.notes, 60)!)
    return bits.join(" ")
  })
  return `${history.length} entries; latest: ${parts.join(" | ")}`
}

function formatProductLine(product: Product, storeName?: string): string {
  const bits: string[] = [
    product.type.toUpperCase(),
    product.name,
    `brand=${product.brand || "unknown"}`,
  ]
  if (product.model) bits.push(`model=${product.model}`)
  if (product.sku) bits.push(`sku=${product.sku}`)
  if (product.color) bits.push(`color=${product.color}`)
  if (product.category) bits.push(`category=${product.category}`)
  if (product.condition) bits.push(`condition=${product.condition}`)
  bits.push(`date=${product.date || "unknown"}`)
  bits.push(`originalPrice=${product.originalPrice}`)

  if (product.type === "have") {
    const have = product as HaveProduct
    bits.push(`priceBought=${have.priceBought}`)
    if (storeName) bits.push(`store=${storeName}`)
    else if (have.purchaseLocation) bits.push(`store=${have.purchaseLocation}`)
    bits.push(`listing=${getListingStatus(have)}`)
    const platforms = getListingPlatforms(have)
    if (platforms.length) bits.push(`platforms=${platforms.join(", ")}`)
    if (have.soldAt) bits.push(`soldAt=${have.soldAt}`)
    if (have.soldWhere) bits.push(`soldWhere=${have.soldWhere}`)
  } else if (product.currentPrice != null) {
    bits.push(`currentPrice=${product.currentPrice}`)
    if (product.targetPrice != null) bits.push(`targetPrice=${product.targetPrice}`)
  }

  const images = normalizeProductImages(product.images)
  if (images.length) bits.push(`images=${images.length}`)

  const notes = clip(product.notes) || clip(htmlToPlainText(product.description || ""))
  if (notes) bits.push(`notes=${notes}`)

  const history = formatPriceHistory(product)
  if (history) bits.push(`priceHistory=${history}`)

  return `- ${bits.join(" | ")}`
}

export async function buildUserInventoryContext(userId: string): Promise<string> {
  const [products, stores] = await Promise.all([
    listProductsByUser(userId),
    listStoresByUser(userId),
  ])

  const storeById = new Map(
    stores
      .filter((s) => s.id)
      .map((s) => [s.id as string, s.name])
  )

  if (!products.length) {
    return `USER INVENTORY: empty. This signed-in user has no saved want/have products yet. Do not invent items they own.`
  }

  const have = products.filter((p) => p.type === "have")
  const want = products.filter((p) => p.type === "want")

  const lines: string[] = [
    `USER INVENTORY (source of truth for this signed-in user). Answer ownership questions ONLY from this list. Do not list generic catalog models they do not own. Demo /sell-compare pages are static samples, not this user's products.`,
    `Counts: ${have.length} have, ${want.length} want.`,
  ]

  if (have.length) {
    lines.push("HAVE:")
    for (const p of have) {
      const storeName =
        p.type === "have" && p.storeId ? storeById.get(p.storeId) : undefined
      lines.push(formatProductLine(p, storeName))
    }
  }

  if (want.length) {
    lines.push("WANT:")
    for (const p of want) {
      lines.push(formatProductLine(p))
    }
  }

  return lines.join("\n")
}
