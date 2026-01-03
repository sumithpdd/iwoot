"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Product, ProductType } from "@/lib/types/product"
import { createProduct, updateProduct } from "@/lib/firebase/products"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import ImageUpload from "@/components/image-upload"
import ProductLookup from "@/components/product-lookup"
import { ProductLookupResult } from "@/lib/services/product-lookup.service"

const wantProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  brand: z.string().min(1, "Brand is required"),
  website: z.string().url("Must be a valid URL"),
  originalPrice: z.number().positive("Price must be positive"),
  date: z.string().min(1, "Date is required"),
  currentPrice: z.number().positive("Price must be positive").optional(),
  targetPrice: z.number().positive("Price must be positive").optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  images: z.array(z.string()).optional(), // Array of image URLs
  notes: z.string().optional(),
})

const haveProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  brand: z.string().min(1, "Brand is required"),
  website: z.string().url("Must be a valid URL"),
  originalPrice: z.number().positive("Price must be positive"),
  priceBought: z.number().positive("Price must be positive"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  images: z.array(z.string()).optional(), // Array of image URLs
  purchaseLocation: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  condition: z.string().optional(),
  notes: z.string().optional(),
  isSelling: z.boolean().optional(),
  sellingOn: z.string().optional(),
})

type WantProductForm = z.infer<typeof wantProductSchema>
type HaveProductForm = z.infer<typeof haveProductSchema>

interface ProductDialogProps {
  open: boolean
  onClose: () => void
  type: ProductType
  product?: Product | null
}

export default function ProductDialog({
  open,
  onClose,
  type,
  product,
}: ProductDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const schema = type === "want" ? wantProductSchema : haveProductSchema

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WantProductForm | HaveProductForm>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          name: product.name,
          brand: product.brand,
          website: product.website,
          originalPrice: product.originalPrice,
          date: product.date,
          ...(type === "want" && "currentPrice" in product
            ? { currentPrice: product.currentPrice }
            : {}),
          ...(type === "have" && "priceBought" in product
            ? { priceBought: product.priceBought }
            : {}),
        }
      : undefined,
  })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        brand: product.brand,
        website: product.website,
        originalPrice: product.originalPrice,
        date: product.date,
        description: product.description || "",
        category: product.category || "",
        model: product.model || "",
        sku: product.sku || "",
        color: product.color || "",
        size: product.size || "",
        images: product.images || [],
        notes: product.notes || "",
        ...(type === "want" && "currentPrice" in product
          ? { currentPrice: product.currentPrice }
          : {}),
        ...(type === "want" && "targetPrice" in product
          ? { targetPrice: product.targetPrice }
          : {}),
        ...(type === "have" && "priceBought" in product
          ? { priceBought: product.priceBought }
          : {}),
        ...(type === "have" && "purchaseLocation" in product
          ? { purchaseLocation: product.purchaseLocation }
          : {}),
        ...(type === "have" && "warrantyExpiry" in product
          ? { warrantyExpiry: product.warrantyExpiry }
          : {}),
        ...(type === "have" && "condition" in product
          ? { condition: product.condition }
          : {}),
        ...(type === "have" && "isSelling" in product
          ? { isSelling: product.isSelling }
          : {}),
        ...(type === "have" && "sellingOn" in product
          ? { sellingOn: product.sellingOn }
          : {}),
      })
    } else {
      reset({
        name: "",
        brand: "",
        website: "",
        originalPrice: 0,
        date: new Date().toISOString().split("T")[0],
        description: "",
        category: "",
        model: "",
        sku: "",
        color: "",
        size: "",
        images: [],
        notes: "",
        ...(type === "want" ? { currentPrice: undefined, targetPrice: undefined } : { priceBought: 0 }),
      })
    }
  }, [product, type, reset])

  const [imageUrls, setImageUrls] = useState<string[]>([])

  useEffect(() => {
    if (product?.images) {
      setImageUrls(product.images)
    } else {
      setImageUrls([])
    }
  }, [product, open])

  const onSubmit = async (data: any) => {
    if (!user) return

    try {
      const productData = {
        ...data,
        type,
        userId: user.uid,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        ...(type === "want"
          ? { currentPrice: data.currentPrice || data.originalPrice }
          : {}),
        // Remove empty strings
        ...Object.fromEntries(
          Object.entries(data).filter(([_, v]) => v !== "" && v !== undefined)
        ),
      }

      if (product?.id) {
        await updateProduct(product.id, productData)
        toast({
          title: "Success",
          description: "Product updated successfully",
        })
      } else {
        await createProduct(productData)
        toast({
          title: "Success",
          description: "Product created successfully",
        })
      }
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] lg:max-w-[1000px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : `Add ${type === "want" ? "Wanted" : "Owned"} Product`}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Update the product information"
              : `Add a new product you ${type === "want" ? "want" : "have"}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Lookup - Only show when creating new product */}
          {!product && (
            <ProductLookup
              onProductFound={(lookupResult: ProductLookupResult) => {
                // Auto-fill form with lookup results
                const currentValues = watch()
                reset({
                  ...currentValues,
                  name: lookupResult.name || currentValues.name || "",
                  brand: lookupResult.brand || currentValues.brand || "",
                  description: lookupResult.description || currentValues.description || "",
                  category: lookupResult.category || currentValues.category || "",
                  model: lookupResult.model || currentValues.model || "",
                  sku: lookupResult.sku || currentValues.sku || "",
                  website: lookupResult.website || currentValues.website || "",
                  originalPrice: lookupResult.price || currentValues.originalPrice || 0,
                  images: lookupResult.images || currentValues.images || [],
                })
                // Update image URLs if provided
                if (lookupResult.images && lookupResult.images.length > 0) {
                  setImageUrls(lookupResult.images)
                }
              }}
              websiteUrl={watch("website")}
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name" className="text-base font-semibold">Product Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Apple iPad Pro 13 M5 WiFi"
                className="h-11 text-base"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand" className="text-base font-semibold">Brand *</Label>
              <Input 
                id="brand" 
                {...register("brand")} 
                placeholder="e.g., Apple"
                className="h-11 text-base"
              />
              {errors.brand && (
                <p className="text-sm text-red-500">{errors.brand.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-base font-semibold">Website URL *</Label>
              <Input
                id="website"
                type="url"
                {...register("website")}
                placeholder="https://www.joybuy.co.uk/..."
                className="h-11 text-base"
              />
              {errors.website && (
                <p className="text-sm text-red-500">{errors.website.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalPrice" className="text-base font-semibold">Original Price (£) *</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                {...register("originalPrice", { valueAsNumber: true })}
                className="h-11 text-base"
              />
              {errors.originalPrice && (
                <p className="text-sm text-red-500">
                  {errors.originalPrice.message as string}
                </p>
              )}
            </div>

            {type === "want" && (
              <div className="space-y-2">
                <Label htmlFor="currentPrice" className="text-base font-semibold">Current Price (£) - Optional</Label>
                <Input
                  id="currentPrice"
                  type="number"
                  step="0.01"
                  {...register("currentPrice", { valueAsNumber: true })}
                  className="h-11 text-base"
                />
                {"currentPrice" in errors && (errors as any).currentPrice && (
                  <p className="text-sm text-red-500">
                    {(errors as any).currentPrice?.message as string}
                  </p>
                )}
              </div>
            )}

            {type === "have" && (
              <div className="space-y-2">
                <Label htmlFor="priceBought" className="text-base font-semibold">Price Bought (£) *</Label>
                <Input
                  id="priceBought"
                  type="number"
                  step="0.01"
                  {...register("priceBought", { valueAsNumber: true })}
                  className="h-11 text-base"
                />
                {"priceBought" in errors && (errors as any).priceBought && (
                  <p className="text-sm text-red-500">
                    {(errors as any).priceBought?.message as string}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date" className="text-base font-semibold">Date *</Label>
              <Input 
                id="date" 
                type="date" 
                {...register("date")}
                className="h-11 text-base"
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date.message as string}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-base font-semibold">Description (Optional)</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Product description..."
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-base font-semibold">Category (Optional)</Label>
              <Input
                id="category"
                {...register("category")}
                placeholder="e.g., Electronics"
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model" className="text-base font-semibold">Model (Optional)</Label>
              <Input
                id="model"
                {...register("model")}
                placeholder="e.g., iPad Pro 13-inch"
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku" className="text-base font-semibold">SKU (Optional)</Label>
              <Input 
                id="sku" 
                {...register("sku")} 
                placeholder="e.g., 10451022"
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color" className="text-base font-semibold">Color (Optional)</Label>
              <Input 
                id="color" 
                {...register("color")} 
                placeholder="e.g., Space Gray"
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size" className="text-base font-semibold">Size (Optional)</Label>
              <Input
                id="size"
                {...register("size")}
                placeholder="e.g., 256GB"
                className="h-11 text-base"
              />
            </div>

            {type === "want" && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="targetPrice" className="text-base font-semibold">Target Price (£) - Optional</Label>
                <Input
                  id="targetPrice"
                  type="number"
                  step="0.01"
                  {...register("targetPrice", { valueAsNumber: true })}
                  placeholder="Price you want to buy at"
                  className="h-11 text-base"
                />
              </div>
            )}

            {type === "have" && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="purchaseLocation" className="text-base font-semibold">Purchase Location (Optional)</Label>
                  <Input
                    id="purchaseLocation"
                    {...register("purchaseLocation")}
                    placeholder="e.g., Apple Store"
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warrantyExpiry" className="text-base font-semibold">Warranty Expiry (Optional)</Label>
                  <Input
                    id="warrantyExpiry"
                    type="date"
                    {...register("warrantyExpiry")}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition" className="text-base font-semibold">Condition (Optional)</Label>
                  <Input
                    id="condition"
                    {...register("condition")}
                    placeholder="e.g., New, Good"
                    className="h-11 text-base"
                  />
                </div>
              </>
            )}
          </div>

          {type === "have" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isSelling"
                    {...register("isSelling")}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isSelling" className="text-base font-semibold cursor-pointer">
                    Currently Selling
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingOn" className="text-base font-semibold">Selling On (Optional)</Label>
                <Input
                  id="sellingOn"
                  {...register("sellingOn")}
                  placeholder="e.g., Gumtree, eBay, Facebook Marketplace"
                  className="h-11 text-base"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <ImageUpload
              images={imageUrls}
              onImagesChange={setImageUrls}
              maxImages={5}
              folder="products"
              userId={user?.uid || ""}
              disabled={!user}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-semibold">Notes (Optional)</Label>
            <Input
              id="notes"
              {...register("notes")}
              placeholder="Additional notes about this product..."
              className="h-11 text-base"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? "Saving..." : product ? "Update Product" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

