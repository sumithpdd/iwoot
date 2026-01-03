"use client"

import { Product, ProductType } from "@/lib/types/product"
import { deleteProduct } from "@/lib/firebase/products"
import { getReceipt } from "@/lib/firebase/receipts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ExternalLink, Image as ImageIcon, Receipt as ReceiptIcon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import Image from "next/image"
import { useEffect, useState } from "react"

interface ProductListProps {
  products: Product[]
  type: ProductType | "all" // Allow "all" for mixed product types
  viewMode?: "grid" | "table"
  onEdit: (product: Product) => void
  onDelete: () => void
}

export default function ProductList({
  products,
  type,
  viewMode = "grid",
  onEdit,
  onDelete,
}: ProductListProps) {
  const { toast } = useToast()
  const [receiptsMap, setReceiptsMap] = useState<Record<string, any>>({})

  useEffect(() => {
    // Load receipts for products that have receiptId
    const loadReceipts = async () => {
      const receipts: Record<string, any> = {}
      for (const product of products) {
        if (product.type === "have" && "receiptId" in product && product.receiptId) {
          try {
            const receipt = await getReceipt(product.receiptId)
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
  }, [products])

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return
    }

    try {
      await deleteProduct(productId)
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
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow 
                key={product.id} 
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <TableCell>
                  {product.images && product.images.length > 0 ? (
                    <div className="relative w-12 h-12 rounded overflow-hidden border border-gray-200 dark:border-gray-700">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                      <ImageIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-white font-semibold">{product.name}</span>
                    {product.model && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{product.model}</span>
                    )}
                    {product.description && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">{product.description}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-gray-700 dark:text-gray-300">{product.brand}</span>
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
                    {product.type === "have" && "isSelling" in product && product.isSelling && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 w-fit">
                        🏷️ {product.sellingOn || "Selling"}
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
                    <span className="font-bold text-gray-900 dark:text-white">£{product.originalPrice.toFixed(2)}</span>
                    {product.type === "want" && "currentPrice" in product && product.currentPrice && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Current: £{product.currentPrice.toFixed(2)}</span>
                    )}
                    {product.type === "have" && "priceBought" in product && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Bought: £{product.priceBought.toFixed(2)}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {format(new Date(product.date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Grid View (default)
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <Card 
          key={product.id} 
          className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 dark:hover:border-blue-700 group cursor-pointer"
        >
          {/* Product Image */}
          {product.images && product.images.length > 0 ? (
            <div className="relative w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
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
              {product.type === "have" && "isSelling" in product && product.isSelling && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                  🏷️ Selling
                  {product.sellingOn && ` on ${product.sellingOn}`}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{product.description}</p>
            )}
            
            {/* Price Information */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  £{product.originalPrice.toFixed(2)}
                </p>
                {product.type === "want" && "currentPrice" in product && product.currentPrice && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Current: <span className="font-semibold text-gray-900 dark:text-white">£{product.currentPrice.toFixed(2)}</span>
                  </p>
                )}
                {product.type === "have" && "priceBought" in product && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-1">
                    Bought: £{product.priceBought.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Date:</span>
                <span className="text-gray-900 dark:text-white">{format(new Date(product.date), "MMM dd, yyyy")}</span>
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
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(product.website, "_blank")}
                className="flex-1 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-700 transition-all duration-200"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(product)}
                className="hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/20 dark:hover:border-green-700 transition-all duration-200"
              >
                <Edit className="h-4 w-4" />
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
      ))}
    </div>
  )
}

