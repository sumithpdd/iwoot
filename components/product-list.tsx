"use client"

import { useCallback, useEffect, useState } from "react"
import { Product, ProductType } from "@/lib/types/product"
import type { Store } from "@/lib/types/store"
import { ProductService } from "@/lib/services/product.service"
import { ReceiptService } from "@/lib/services/receipt.service"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ExternalLink, Image as ImageIcon, Receipt as ReceiptIcon, TrendingUp, TrendingDown, History, Download } from "lucide-react"
import { downloadProductPhotosZip } from "@/lib/api/storage-client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"
import Image from "next/image"
import { WebsiteLinkPreview } from "@/components/website-link-preview"
import { normalizeProductImages } from "@/lib/utils/product-images"
import { ProductDescriptionDisplay } from "@/components/product-description-display"
import { getListingPlatforms, getListingStatus } from "@/lib/utils/product-listing"

function formatByEmail(
  email: string | undefined,
  viewerEmail: string | null | undefined
) {
  if (!email) return "—"
  if (viewerEmail && email === viewerEmail) return "You"
  return email
}

function storeLabel(stores: Store[], storeId: string | null | undefined): string | null {
  if (storeId === undefined || storeId === null || storeId === "") return null
  return stores.find((s) => s.id === storeId)?.name ?? null
}

function safeFormatWhen(value: string | undefined, pattern: string) {
  if (!value) return "—"
  try {
    const d = parseISO(value)
    if (Number.isNaN(d.getTime())) return "—"
    return format(d, pattern)
  } catch {
    return "—"
  }
}

interface ProductListProps {
  products: Product[]
  type: ProductType | "all" // Allow "all" for mixed product types
  viewMode?: "grid" | "table"
  /** Signed-in user email for “You” in audit labels */
  viewerEmail?: string | null
  /** Resolve `storeId` on “have” products */
  stores?: Store[]
  onEdit: (product: Product) => void
  onDelete: () => void
}

export default function ProductList({
  products,
  type: _type,
  viewMode = "grid",
  viewerEmail,
  stores = [],
  onEdit,
  onDelete,
}: ProductListProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const resolvedViewerEmail = viewerEmail ?? user?.email ?? null
  const getToken = useCallback(
    () => user?.getIdToken() ?? Promise.resolve(null),
    [user]
  )
  const [receiptsMap, setReceiptsMap] = useState<Record<string, any>>({})

  useEffect(() => {
    // Load receipts for products that have receiptId
    const loadReceipts = async () => {
      const receipts: Record<string, any> = {}
      for (const product of products) {
        if (product.type === "have" && "receiptId" in product && product.receiptId) {
          try {
            const receipt = await ReceiptService.getReceipt(
              getToken,
              product.receiptId
            )
            if (receipt) {
              receipts[product.receiptId] = receipt
            }
          } catch (error) {
            console.error("Error loading receipt:", error)
          }
        }
      }
      setReceiptsMap(receipts)
    }
    if (products.length > 0) {
      loadReceipts()
    }
  }, [products, getToken])

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return
    }

    try {
      await ProductService.deleteProduct(getToken, productId)
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
      onDelete()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownloadPhotos = async (product: Product) => {
    if (!product.id) return
    const count = normalizeProductImages(product.images).length
    if (count === 0) {
      toast({
        title: "No photos",
        description: "Add photos to this product first.",
        variant: "destructive",
      })
      return
    }
    setDownloadingId(product.id)
    try {
      await downloadProductPhotosZip(getToken, product.id)
      toast({
        title: "Photos downloaded",
        description: `${count} photo${count === 1 ? "" : "s"} saved as a zip — ready for Gumtree / marketplace uploads.`,
      })
    } catch (error: unknown) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Could not download photos",
        variant: "destructive",
      })
    } finally {
      setDownloadingId(null)
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products yet. Add your first product!</p>
      </div>
    )
  }

  // Table View
  if (viewMode === "table") {
    return (
      <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="min-w-[100px]">Purchase / listed</TableHead>
              <TableHead className="min-w-[120px]">Created</TableHead>
              <TableHead className="min-w-[120px]">Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const imageEntries = normalizeProductImages(product.images)
              return (
              <TableRow 
                key={product.id} 
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => onEdit(product)}
              >
                <TableCell className="align-top">
                  {imageEntries.length > 0 ? (
                    <div className="flex max-w-[120px] gap-1 overflow-x-auto py-0.5">
                      {imageEntries.map((im, idx) => (
                        <div
                          key={`${im.url}-${idx}`}
                          className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-gray-200 dark:border-gray-700"
                          title={[...(im.tags || [])].join(", ") || product.name}
                        >
                          <Image
                            src={im.url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                      <ImageIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium max-w-[240px]">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-900 dark:text-white font-semibold">{product.name}</span>
                    {product.model && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{product.model}</span>
                    )}
                    <ProductDescriptionDisplay
                      html={product.description}
                      mode="preview"
                      className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1"
                    />
                    {product.website?.trim() && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <WebsiteLinkPreview url={product.website} compact className="text-xs" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-700 dark:text-gray-300">{product.brand}</span>
                    {product.type === "have" && (
                      <span className="text-xs text-muted-foreground">
                        {storeLabel(stores, product.storeId) ? (
                          <>Store: {storeLabel(stores, product.storeId)}</>
                        ) : "purchaseLocation" in product && product.purchaseLocation ? (
                          <>{product.purchaseLocation}</>
                        ) : null}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {product.type === "want" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 w-fit">
                        💙 I Want
                      </span>
                    )}
                    {product.type === "have" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 w-fit">
                        ✅ I Have
                      </span>
                    )}
                    {product.type === "have" && getListingStatus(product) === "selling" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 w-fit max-w-full">
                        🏷️ Selling{getListingPlatforms(product).length ? ` · ${getListingPlatforms(product).join(", ")}` : ""}
                      </span>
                    )}
                    {product.type === "have" && getListingStatus(product) === "sold" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 w-fit max-w-full">
                        ✓ Sold
                        {product.soldAt && ` · ${product.soldAt}`}
                        {product.soldWhere && ` · ${product.soldWhere}`}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {product.category ? (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                      {product.category}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white">£{product.originalPrice.toFixed(2)}</span>
                      {product.priceHistory && product.priceHistory.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          <History className="h-3 w-3" />
                          {product.priceHistory.length}
                        </span>
                      )}
                    </div>
                    {product.type === "want" && "currentPrice" in product && product.currentPrice && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Current: £{product.currentPrice.toFixed(2)}</span>
                    )}
                    {product.type === "have" && "priceBought" in product && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Bought: £{product.priceBought.toFixed(2)}</span>
                    )}
                    {product.priceHistory && product.priceHistory.length > 0 && (() => {
                      const sortedHistory = [...product.priceHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      const latestPrice = sortedHistory[0].price
                      const priceChange = latestPrice - product.originalPrice
                      const percentChange = ((priceChange / product.originalPrice) * 100).toFixed(1)
                      if (Math.abs(priceChange) > 0.01) {
                        return (
                          <span className={`text-xs font-medium flex items-center gap-1 ${
                            priceChange > 0 
                              ? "text-red-600 dark:text-red-400" 
                              : "text-green-600 dark:text-green-400"
                          }`}>
                            {priceChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {priceChange > 0 ? "+" : ""}{percentChange}%
                          </span>
                        )
                      }
                      return null
                    })()}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-gray-600 dark:text-gray-400 align-top">
                  {safeFormatWhen(product.date, "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-xs text-gray-600 dark:text-gray-400 align-top">
                  <div>{safeFormatWhen(product.createdAt, "MMM d, yyyy HH:mm")}</div>
                  <div className="text-muted-foreground mt-0.5">
                    by {formatByEmail(product.createdByEmail, resolvedViewerEmail)}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-gray-600 dark:text-gray-400 align-top">
                  <div>{safeFormatWhen(product.updatedAt, "MMM d, yyyy HH:mm")}</div>
                  <div className="text-muted-foreground mt-0.5">
                    by {formatByEmail(product.updatedByEmail, resolvedViewerEmail)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {imageEntries.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadPhotos(product)}
                        disabled={downloadingId === product.id}
                        className="h-8 w-8 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        title="Download all photos (zip)"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(product.website, "_blank")}
                      className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="View Website"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onEdit(product)}
                      className="h-8 w-8 hover:bg-green-50 dark:hover:bg-green-900/20"
                      title="Edit Product"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => product.id && handleDelete(product.id)}
                      className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete Product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Grid View (default)
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const imageEntries = normalizeProductImages(product.images)
        const primary = imageEntries[0]
        return (
        <Card 
          key={product.id} 
          role="button"
          tabIndex={0}
          onClick={() => onEdit(product)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onEdit(product)
            }
          }}
          className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 dark:hover:border-blue-700 group cursor-pointer"
        >
          {/* Product images */}
          {primary ? (
            <>
              <div className="relative w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                <Image
                  src={primary.url}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  unoptimized
                  title={(primary.tags || []).join(", ") || undefined}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              {imageEntries.length > 1 && (
                <div className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900/80">
                  {imageEntries.map((im, idx) => (
                    <div
                      key={`${im.url}-${idx}`}
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-gray-200 dark:border-gray-600"
                      title={(im.tags || []).join(", ") || `Photo ${idx + 1}`}
                    >
                      <Image
                        src={im.url}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                        }}
                      />
                      {im.tags && im.tags.length > 0 && (
                        <span className="absolute bottom-0 left-0 right-0 truncate bg-black/65 px-0.5 text-center text-[10px] leading-tight text-white">
                          {im.tags[0]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center group-hover:from-blue-50 group-hover:to-purple-50 dark:group-hover:from-blue-900/20 dark:group-hover:to-purple-900/20 transition-all duration-300">
              <ImageIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 group-hover:text-blue-400 transition-colors duration-300" />
            </div>
          )}
          
          <CardHeader className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 pb-3">
            <CardTitle className="text-xl font-bold line-clamp-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {product.name}
            </CardTitle>
            <CardDescription className="text-sm font-medium text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">{product.brand}</span>
              {product.category && (
                <>
                  <span className="mx-2">•</span>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                    {product.category}
                  </span>
                </>
              )}
              {product.color && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-gray-500 dark:text-gray-400">{product.color}</span>
                </>
              )}
            </CardDescription>
            {/* Product Type Badge */}
            <div className="mt-2 flex items-center gap-2">
              {product.type === "want" && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  💙 I Want
                </span>
              )}
              {product.type === "have" && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  ✅ I Have
                </span>
              )}
              {product.type === "have" && getListingStatus(product) === "selling" && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                  🏷️ Selling
                  {getListingPlatforms(product).length > 0 && ` · ${getListingPlatforms(product).join(", ")}`}
                </span>
              )}
              {product.type === "have" && getListingStatus(product) === "sold" && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  ✓ Sold
                  {product.soldAt && ` · ${product.soldAt}`}
                  {product.soldWhere && ` · ${product.soldWhere}`}
                </span>
              )}
            </div>
            {product.website?.trim() && (
              <div className="mt-2 px-1" onClick={(e) => e.stopPropagation()}>
                <WebsiteLinkPreview url={product.website} compact />
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Description */}
            <ProductDescriptionDisplay
              html={product.description}
              mode="block"
              className="text-sm text-gray-600 dark:text-gray-400"
            />
            
            {/* Price Information */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    £{product.originalPrice.toFixed(2)}
                  </p>
                  {product.priceHistory && product.priceHistory.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      <History className="h-3 w-3" />
                      {product.priceHistory.length}
                    </span>
                  )}
                </div>
                {product.type === "want" && "currentPrice" in product && product.currentPrice && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current: <span className="font-semibold text-gray-900 dark:text-white">£{product.currentPrice.toFixed(2)}</span>
                    </p>
                    {product.priceHistory && product.priceHistory.length > 0 && (() => {
                      const sortedHistory = [...product.priceHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      const latestPrice = sortedHistory[0].price
                      const priceChange = product.currentPrice! - latestPrice
                      const percentChange = ((priceChange / latestPrice) * 100).toFixed(1)
                      if (priceChange !== 0) {
                        return (
                          <span className={`text-xs font-medium flex items-center gap-1 ${
                            priceChange > 0 
                              ? "text-red-600 dark:text-red-400" 
                              : "text-green-600 dark:text-green-400"
                          }`}>
                            {priceChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {priceChange > 0 ? "+" : ""}{percentChange}%
                          </span>
                        )
                      }
                      return null
                    })()}
                  </div>
                )}
                {product.type === "have" && "priceBought" in product && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-1">
                    Bought: £{product.priceBought.toFixed(2)}
                  </p>
                )}
                {product.priceHistory && product.priceHistory.length > 0 && (() => {
                  const sortedHistory = [...product.priceHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  const latestPrice = sortedHistory[0].price
                  const priceChange = latestPrice - product.originalPrice
                  const percentChange = ((priceChange / product.originalPrice) * 100).toFixed(1)
                  if (Math.abs(priceChange) > 0.01) {
                    return (
                      <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${
                        priceChange > 0 
                          ? "text-red-600 dark:text-red-400" 
                          : "text-green-600 dark:text-green-400"
                      }`}>
                        {priceChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        Latest: £{latestPrice.toFixed(2)} ({priceChange > 0 ? "+" : ""}{percentChange}% vs original)
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2 text-sm">
              {product.type === "have" && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Store / purchase</span>
                  <span className="text-gray-900 dark:text-white text-right text-xs">
                    {storeLabel(stores, product.storeId) ||
                      ("purchaseLocation" in product && product.purchaseLocation) ||
                      "—"}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">Purchase / listed</span>
                <span className="text-gray-900 dark:text-white text-right">
                  {safeFormatWhen(product.date, "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">Created</span>
                <span className="text-gray-900 dark:text-white text-right text-xs leading-snug">
                  {safeFormatWhen(product.createdAt, "MMM d, yyyy HH:mm")}
                  <span className="block text-muted-foreground">
                    by {formatByEmail(product.createdByEmail, resolvedViewerEmail)}
                  </span>
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">Updated</span>
                <span className="text-gray-900 dark:text-white text-right text-xs leading-snug">
                  {safeFormatWhen(product.updatedAt, "MMM d, yyyy HH:mm")}
                  <span className="block text-muted-foreground">
                    by {formatByEmail(product.updatedByEmail, resolvedViewerEmail)}
                  </span>
                </span>
              </div>
              {product.model && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Model:</span>
                  <span className="text-gray-900 dark:text-white">{product.model}</span>
                </div>
              )}
              {product.type === "have" && "receiptId" in product && product.receiptId && receiptsMap[product.receiptId] && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <ReceiptIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Receipt: {receiptsMap[product.receiptId].receiptNumber}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div
              className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(product)}
                className="flex-1 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-700 transition-all duration-200"
              >
                <Edit className="mr-2 h-4 w-4" />
                Details
              </Button>
              {imageEntries.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPhotos(product)}
                  disabled={downloadingId === product.id}
                  className="hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-900/20 dark:hover:border-amber-700 transition-all duration-200"
                  title="Download all photos as zip for marketplace posts"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(product.website, "_blank")}
                className="hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/20 dark:hover:border-green-700 transition-all duration-200"
                title="Open product website"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => product.id && handleDelete(product.id)}
                className="hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        )
      })}
    </div>
  )
}

