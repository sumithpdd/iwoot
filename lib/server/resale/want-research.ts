import { randomUUID } from "crypto"
import {
  createProductDoc,
  getProductById,
  listProductsByUser,
  updateProductDoc,
} from "@/lib/server/repositories/products.repository"
import {
  createWantBasketDoc,
  getWantBasketById,
  listWantBasketsByUser,
  updateWantBasketDoc,
} from "@/lib/server/repositories/want-baskets.repository"
import type { HaveProduct, Product, WantProduct } from "@/lib/types/product"
import type { WantBasket } from "@/lib/types/want-basket"
import type {
  BuyingPlanStep,
  BuyingStage,
  HaveDisposition,
  PriceBenchmark,
  ResearchLink,
  ResearchVisit,
  ResearchVisitKind,
} from "@/lib/types/want-research"
import { isAbsoluteUrl } from "@/lib/utils/http-url"
import { matchOwnedProduct } from "@/lib/utils/match-owned-product"

const BUYING_STAGES = new Set<BuyingStage>([
  "researching",
  "shortlisted",
  "ready_to_buy",
  "ordered",
  "bought",
  "cancelled",
])

function matchBasket(baskets: WantBasket[], query: string): WantBasket | undefined {
  const q = query.trim().toLowerCase()
  if (!q) return undefined
  return (
    baskets.find((b) => b.id === query.trim()) ||
    baskets.find((b) => b.title.toLowerCase().includes(q))
  )
}

export async function listWantResearchContext(uid: string) {
  const [products, baskets] = await Promise.all([
    listProductsByUser(uid, "want"),
    listWantBasketsByUser(uid),
  ])
  return {
    baskets: baskets.map((b) => ({
      id: b.id,
      title: b.title,
      buyingStage: b.buyingStage ?? null,
      targetTotalGbp: b.targetTotalGbp ?? null,
      visitCount: b.researchVisits?.length ?? 0,
      benchmarkCount: b.priceBenchmarks?.length ?? 0,
      planSteps: b.buyingPlanSteps?.length ?? 0,
    })),
    wants: products.map((p) => {
      const w = p as WantProduct
      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        model: p.model ?? null,
        targetPrice: w.targetPrice ?? null,
        currentPrice: w.currentPrice ?? null,
        buyingStage: w.buyingStage ?? null,
        wantBasketId: w.wantBasketId ?? null,
        visitCount: w.researchVisits?.length ?? 0,
        benchmarkCount: w.priceBenchmarks?.length ?? 0,
      }
    }),
  }
}

export async function upsertWantBasket(
  uid: string,
  input: {
    basketId?: string
    title: string
    blurb?: string
    buyingStage?: BuyingStage
    targetTotalGbp?: number | null
    currencyNote?: string
    researchSummary?: string
  }
): Promise<{ ok: true; basketId: string } | { ok: false; error: string }> {
  const title = input.title.trim()
  if (!title) return { ok: false, error: "title is required" }
  if (input.buyingStage && !BUYING_STAGES.has(input.buyingStage)) {
    return { ok: false, error: "invalid buyingStage" }
  }

  if (input.basketId) {
    const existing = await getWantBasketById(input.basketId)
    if (!existing || existing.userId !== uid) {
      return { ok: false, error: "Basket not found" }
    }
    await updateWantBasketDoc(input.basketId, {
      title,
      blurb: input.blurb ?? existing.blurb ?? null,
      buyingStage: input.buyingStage ?? existing.buyingStage ?? "researching",
      targetTotalGbp:
        input.targetTotalGbp !== undefined
          ? input.targetTotalGbp
          : existing.targetTotalGbp ?? null,
      currencyNote: input.currencyNote ?? existing.currencyNote ?? null,
      researchSummary:
        input.researchSummary ?? existing.researchSummary ?? null,
    })
    return { ok: true, basketId: input.basketId }
  }

  const id = await createWantBasketDoc({
    userId: uid,
    title,
    blurb: input.blurb,
    buyingStage: input.buyingStage || "researching",
    targetTotalGbp: input.targetTotalGbp ?? null,
    currencyNote: input.currencyNote,
    researchSummary: input.researchSummary,
    researchVisits: [],
    priceBenchmarks: [],
    researchLinks: [],
    buyingPlanSteps: [],
  })
  return { ok: true, basketId: id }
}

export async function upsertWantProduct(
  uid: string,
  input: {
    productId?: string
    name: string
    brand: string
    website: string
    originalPrice: number
    targetPrice?: number
    currentPrice?: number
    model?: string
    sku?: string
    color?: string
    size?: string
    category?: string
    notes?: string
    /** Rich product description (plain text or HTML) — always fill when known */
    description?: string
    researchSummary?: string
    buyingStage?: BuyingStage
    wantBasketId?: string | null
    brandId?: string | null
    /** Default true: find/create Brand profile and set brandId */
    ensureBrand?: boolean
    brandWebsite?: string
    specifications?: Record<string, string>
    /** Direct image URLs to download into Storage (not gallery HTML pages) */
    imageUrls?: string[]
  }
): Promise<
  | {
      ok: true
      productId: string
      brandId?: string | null
      imagesAttached?: number
    }
  | { ok: false; error: string }
> {
  if (!input.name.trim() || !input.brand.trim()) {
    return { ok: false, error: "name and brand are required" }
  }
  if (!isAbsoluteUrl(input.website)) {
    return { ok: false, error: "website must be a valid URL" }
  }
  if (input.wantBasketId) {
    const basket = await getWantBasketById(input.wantBasketId)
    if (!basket || basket.userId !== uid) {
      return { ok: false, error: "wantBasketId not found" }
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const brandName = input.brand.trim()
  let brandId: string | null | undefined = input.brandId

  if (brandId) {
    const { getBrandById } = await import(
      "@/lib/server/repositories/brands.repository"
    )
    const b = await getBrandById(brandId)
    if (!b || b.userId !== uid) {
      return { ok: false, error: "brandId not found" }
    }
  } else if (input.ensureBrand !== false) {
    const { ensureBrandId } = await import("@/lib/server/resale/brands")
    brandId = await ensureBrandId(uid, brandName, {
      website: input.brandWebsite || input.website,
    })
  }

  const description =
    typeof input.description === "string" ? input.description.trim() : undefined

  if (input.productId) {
    const existing = await getProductById(input.productId)
    if (!existing || existing.userId !== uid || existing.type !== "want") {
      return { ok: false, error: "Want product not found" }
    }
    await updateProductDoc(input.productId, {
      name: input.name.trim(),
      brand: brandName,
      website: input.website.trim(),
      originalPrice: input.originalPrice,
      targetPrice: input.targetPrice ?? null,
      currentPrice: input.currentPrice ?? null,
      model: input.model ?? null,
      sku: input.sku ?? null,
      color: input.color ?? null,
      size: input.size ?? null,
      category: input.category ?? null,
      notes: input.notes ?? null,
      ...(description !== undefined ? { description } : {}),
      researchSummary: input.researchSummary ?? null,
      buyingStage: input.buyingStage ?? null,
      wantBasketId:
        input.wantBasketId === undefined ? undefined : input.wantBasketId,
      specifications: input.specifications ?? null,
      ...(brandId !== undefined ? { brandId } : {}),
    })

    let imagesAttached = 0
    if (input.imageUrls?.length) {
      const { attachProductImages } = await import(
        "@/lib/server/resale/product-media"
      )
      const media = await attachProductImages(uid, {
        query: input.productId,
        imageUrls: input.imageUrls,
      })
      if (media.ok) imagesAttached = media.added
    }

    return {
      ok: true,
      productId: input.productId,
      brandId: brandId ?? null,
      ...(imagesAttached ? { imagesAttached } : {}),
    }
  }

  const id = await createProductDoc({
    type: "want",
    name: input.name.trim(),
    brand: brandName,
    website: input.website.trim(),
    originalPrice: input.originalPrice,
    date: today,
    userId: uid,
    targetPrice: input.targetPrice,
    currentPrice: input.currentPrice,
    model: input.model,
    sku: input.sku,
    color: input.color,
    size: input.size,
    category: input.category,
    notes: input.notes,
    description: description || undefined,
    researchSummary: input.researchSummary,
    buyingStage: input.buyingStage || "researching",
    wantBasketId: input.wantBasketId ?? null,
    brandId: brandId ?? null,
    specifications: input.specifications,
    researchVisits: [],
    priceBenchmarks: [],
    researchLinks: [],
    buyingPlanSteps: [],
  } as Omit<WantProduct, "id" | "createdAt" | "updatedAt">)

  let imagesAttached = 0
  if (input.imageUrls?.length) {
    const { attachProductImages } = await import(
      "@/lib/server/resale/product-media"
    )
    const media = await attachProductImages(uid, {
      query: id,
      imageUrls: input.imageUrls,
    })
    if (media.ok) imagesAttached = media.added
  }

  return {
    ok: true,
    productId: id,
    brandId: brandId ?? null,
    ...(imagesAttached ? { imagesAttached } : {}),
  }
}

type TargetKind = "product" | "basket"

async function resolveTarget(
  uid: string,
  query: string,
  prefer: TargetKind = "product"
): Promise<
  | { kind: "product"; product: WantProduct }
  | { kind: "basket"; basket: WantBasket }
  | { error: string }
> {
  if (prefer === "basket") {
    const baskets = await listWantBasketsByUser(uid)
    const basket = matchBasket(baskets, query)
    if (basket) return { kind: "basket", basket }
  }
  const products = await listProductsByUser(uid, "want")
  const product = matchOwnedProduct(products, query)
  if (product && product.type === "want") {
    return { kind: "product", product: product as WantProduct }
  }
  const baskets = await listWantBasketsByUser(uid)
  const basket = matchBasket(baskets, query)
  if (basket) return { kind: "basket", basket }
  return { error: "No matching want product or basket" }
}

export async function addResearchVisit(
  uid: string,
  input: {
    query: string
    target?: TargetKind
    place: string
    kind?: ResearchVisitKind
    checkedAt?: string
    whatFound: string
    url?: string
    priceLocal?: number
    currency?: string
    notes?: string
  }
) {
  const target = await resolveTarget(uid, input.query, input.target || "product")
  if ("error" in target) return { ok: false as const, error: target.error }
  if (!input.place.trim() || !input.whatFound.trim()) {
    return { ok: false as const, error: "place and whatFound are required" }
  }
  if (input.url && !isAbsoluteUrl(input.url)) {
    return { ok: false as const, error: "url must be valid if provided" }
  }

  const visit: ResearchVisit = {
    id: randomUUID(),
    place: input.place.trim(),
    kind: input.kind || "checked_online",
    checkedAt: input.checkedAt || new Date().toISOString().slice(0, 10),
    whatFound: input.whatFound.trim(),
    url: input.url?.trim(),
    priceLocal: input.priceLocal,
    currency: input.currency,
    notes: input.notes?.trim(),
  }

  if (target.kind === "product") {
    const list = [...(target.product.researchVisits || []), visit]
    await updateProductDoc(target.product.id!, { researchVisits: list })
    return { ok: true as const, target: "product", id: target.product.id, visit }
  }
  const list = [...(target.basket.researchVisits || []), visit]
  await updateWantBasketDoc(target.basket.id, { researchVisits: list })
  return { ok: true as const, target: "basket", id: target.basket.id, visit }
}

export async function addPriceBenchmark(
  uid: string,
  input: {
    query: string
    target?: TargetKind
    itemLabel: string
    venue: string
    priceGbp?: number | null
    priceLocal?: number | null
    currency?: string
    url?: string
    specification?: string
    notes?: string
    lastCheckedIso?: string
  }
) {
  const target = await resolveTarget(uid, input.query, input.target || "product")
  if ("error" in target) return { ok: false as const, error: target.error }
  if (!input.itemLabel.trim() || !input.venue.trim()) {
    return { ok: false as const, error: "itemLabel and venue are required" }
  }

  const row: PriceBenchmark = {
    id: randomUUID(),
    itemLabel: input.itemLabel.trim(),
    venue: input.venue.trim(),
    priceGbp:
      input.priceGbp === undefined || input.priceGbp === null
        ? null
        : Number(input.priceGbp),
    priceLocal: input.priceLocal ?? null,
    currency: input.currency,
    url: input.url?.trim(),
    lastCheckedIso: input.lastCheckedIso || new Date().toISOString().slice(0, 10),
    notes: input.notes?.trim(),
    specification: input.specification?.trim(),
  }

  if (target.kind === "product") {
    const list = [...(target.product.priceBenchmarks || []), row]
    await updateProductDoc(target.product.id!, { priceBenchmarks: list })
    if (row.priceGbp != null) {
      await updateProductDoc(target.product.id!, { currentPrice: row.priceGbp })
    }
    return { ok: true as const, target: "product", id: target.product.id, benchmark: row }
  }
  const list = [...(target.basket.priceBenchmarks || []), row]
  await updateWantBasketDoc(target.basket.id, { priceBenchmarks: list })
  return { ok: true as const, target: "basket", id: target.basket.id, benchmark: row }
}

export async function addResearchLink(
  uid: string,
  input: { query: string; target?: TargetKind; label: string; url: string; notes?: string }
) {
  const target = await resolveTarget(uid, input.query, input.target || "product")
  if ("error" in target) return { ok: false as const, error: target.error }
  if (!input.label.trim() || !isAbsoluteUrl(input.url)) {
    return { ok: false as const, error: "label and valid url are required" }
  }
  const link: ResearchLink = {
    id: randomUUID(),
    label: input.label.trim(),
    url: input.url.trim(),
    notes: input.notes?.trim(),
  }
  if (target.kind === "product") {
    const list = [...(target.product.researchLinks || []), link]
    await updateProductDoc(target.product.id!, { researchLinks: list })
    return { ok: true as const, target: "product", id: target.product.id, link }
  }
  const list = [...(target.basket.researchLinks || []), link]
  await updateWantBasketDoc(target.basket.id, { researchLinks: list })
  return { ok: true as const, target: "basket", id: target.basket.id, link }
}

export async function setBuyingPlanSteps(
  uid: string,
  input: {
    query: string
    target?: TargetKind
    steps: { title: string; detail?: string; done?: boolean; links?: { label: string; url: string }[] }[]
  }
) {
  const target = await resolveTarget(uid, input.query, input.target || "basket")
  if ("error" in target) return { ok: false as const, error: target.error }
  const steps: BuyingPlanStep[] = input.steps.map((s, i) => ({
    id: randomUUID(),
    order: i + 1,
    title: s.title.trim(),
    detail: s.detail?.trim(),
    done: Boolean(s.done),
    links: (s.links || [])
      .filter((l) => l.label && isAbsoluteUrl(l.url))
      .map((l) => ({
        id: randomUUID(),
        label: l.label.trim(),
        url: l.url.trim(),
      })),
  }))
  if (target.kind === "product") {
    await updateProductDoc(target.product.id!, { buyingPlanSteps: steps })
    return { ok: true as const, target: "product", id: target.product.id, steps }
  }
  await updateWantBasketDoc(target.basket.id, { buyingPlanSteps: steps })
  return { ok: true as const, target: "basket", id: target.basket.id, steps }
}

export async function updateBuyingStage(
  uid: string,
  input: { query: string; target?: TargetKind; buyingStage: BuyingStage }
) {
  if (!BUYING_STAGES.has(input.buyingStage)) {
    return { ok: false as const, error: "invalid buyingStage" }
  }
  const target = await resolveTarget(uid, input.query, input.target || "product")
  if ("error" in target) return { ok: false as const, error: target.error }
  if (target.kind === "product") {
    await updateProductDoc(target.product.id!, { buyingStage: input.buyingStage })
    return {
      ok: true as const,
      target: "product",
      id: target.product.id,
      buyingStage: input.buyingStage,
    }
  }
  await updateWantBasketDoc(target.basket.id, { buyingStage: input.buyingStage })
  return {
    ok: true as const,
    target: "basket",
    id: target.basket.id,
    buyingStage: input.buyingStage,
  }
}

export async function getWantDetails(uid: string, query: string) {
  const { normalizeProductImages } = await import(
    "@/lib/utils/product-images"
  )
  const target = await resolveTarget(uid, query, "product")
  if ("error" in target) return { ok: false as const, error: target.error }
  if (target.kind === "basket") {
    const products = await listProductsByUser(uid, "want")
    const items = products.filter(
      (p) => (p as WantProduct).wantBasketId === target.basket.id
    )
    return {
      ok: true as const,
      kind: "basket" as const,
      basket: target.basket,
      items: items.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        targetPrice: (p as WantProduct).targetPrice ?? null,
        buyingStage: (p as WantProduct).buyingStage ?? null,
        uploadedImageCount: normalizeProductImages(p.images).length,
      })),
    }
  }
  const product = target.product
  const uploadedImages = normalizeProductImages(product.images)
  return {
    ok: true as const,
    kind: "product" as const,
    media: {
      uploadedImageCount: uploadedImages.length,
      uploadedImageTags: uploadedImages.flatMap((im) => im.tags || []).slice(0, 20),
      researchLinkCount: product.researchLinks?.length ?? 0,
      note:
        "uploadedImageCount is product photos in Storage. researchLinks are bookmarks only (e.g. Apple gallery pages), not photos. To add photos use tool attach_product_images with direct image URLs.",
    },
    product,
  }
}

export async function convertWantToHave(
  uid: string,
  input: {
    query: string
    priceBought: number
    purchaseLocation?: string
    storeId?: string
    notes?: string
  }
) {
  const products = await listProductsByUser(uid, "want")
  const product = matchOwnedProduct(products, input.query)
  if (!product || product.type !== "want") {
    return { ok: false as const, error: "No matching want product" }
  }
  if (!Number.isFinite(input.priceBought) || input.priceBought <= 0) {
    return { ok: false as const, error: "priceBought must be > 0" }
  }
  const w = product as WantProduct
  await updateProductDoc(product.id!, {
    type: "have",
    priceBought: input.priceBought,
    purchaseLocation: input.purchaseLocation ?? null,
    storeId: input.storeId ?? null,
    listingStatus: "not_listed",
    disposition: "kept",
    buyingStage: "bought",
    convertedFromWantId: product.id,
    notes: input.notes
      ? `${w.notes || ""}\n${input.notes}`.trim()
      : w.notes ?? null,
    // clear want-only basket link is fine to keep for history
  })
  return { ok: true as const, productId: product.id, type: "have" as const }
}

export async function updateHaveDisposition(
  uid: string,
  input: {
    query: string
    disposition: HaveDisposition
    soldWhere?: string
    soldAt?: string
  }
) {
  const products = await listProductsByUser(uid, "have")
  const product = matchOwnedProduct(products, input.query)
  if (!product || product.type !== "have") {
    return { ok: false as const, error: "No matching have product" }
  }
  const updates: Record<string, unknown> = {
    disposition: input.disposition,
  }
  if (input.disposition === "sold" || input.disposition === "selling") {
    updates.listingStatus = input.disposition === "sold" ? "sold" : "selling"
  }
  if (input.disposition === "sold") {
    updates.soldAt = input.soldAt || new Date().toISOString().slice(0, 10)
    if (input.soldWhere) updates.soldWhere = input.soldWhere
  }
  if (input.disposition === "gifted" || input.disposition === "recycled") {
    updates.listingStatus = "sold"
    updates.soldWhere = input.soldWhere || input.disposition
    updates.soldAt = input.soldAt || new Date().toISOString().slice(0, 10)
  }
  await updateProductDoc(product.id!, updates)
  return {
    ok: true as const,
    productId: product.id,
    disposition: input.disposition,
  }
}

export async function appendProductNotes(
  uid: string,
  input: { query: string; notes: string; type?: "want" | "have" | "all" }
) {
  const typeFilter =
    input.type === "want" || input.type === "have" ? input.type : undefined
  const products = await listProductsByUser(uid, typeFilter)
  const product = matchOwnedProduct(products, input.query)
  if (!product || product.userId !== uid) {
    return { ok: false as const, error: "Product not found" }
  }
  const prev = String(product.notes || "").trim()
  const next = prev ? `${prev}\n\n${input.notes.trim()}` : input.notes.trim()
  await updateProductDoc(product.id!, { notes: next })
  return { ok: true as const, productId: product.id }
}

/** For createProductDoc typing when casting want fields */
export type { HaveProduct }
