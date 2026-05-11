"use client"

import { useCallback, useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Product, ProductType, type ProductImageEntry } from "@/lib/types/product"
import type { Store } from "@/lib/types/store"
import type { Brand } from "@/lib/types/brand"
import { ProductService } from "@/lib/services/product.service"
import { StoreService } from "@/lib/services/store.service"
import { BrandService } from "@/lib/services/brand.service"
import { ReceiptService } from "@/lib/services/receipt.service"
import { useAuth } from "@/lib/auth-context"
import { AiProductFieldAssist } from "@/components/ai-product-field-assist"
import {
  CopyToClipboardButton,
  copyFieldText,
} from "@/components/copy-to-clipboard-button"
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
import { WebsiteLinkPreview } from "@/components/website-link-preview"
import StoreDialog, { type StoreDialogProps } from "@/components/store-dialog"
import BrandDialog from "@/components/brand-dialog"
import { ListingPlatformsMultiSelect } from "@/components/listing-platforms-multi-select"
import ProductLookup from "@/components/product-lookup"
import { storeDraftFromReceipt } from "@/lib/utils/store-from-receipt"
import { normalizeProductImages, sanitizeImageEntriesForSave } from "@/lib/utils/product-images"
import { ProductLookupResult } from "@/lib/services/product-lookup.service"
import PriceHistoryComponent from "@/components/price-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Loader2, ChevronDown, Scale } from "lucide-react"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ProductSpecificationsEditor } from "@/components/product-specifications-editor"
import { htmlToPlainText } from "@/lib/utils/html-plain-text"
import { getListingPlatforms, getListingStatus } from "@/lib/utils/product-listing"

const wantProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  brand: z.string().min(1, "Brand is required"),
  brandId: z.string().optional(),
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
  notes: z.string().optional(),
  specifications: z.record(z.string(), z.string()).optional(),
})

const haveProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  brand: z.string().min(1, "Brand is required"),
  brandId: z.string().optional(),
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
  storeId: z.string().optional(),
  purchaseLocation: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  condition: z.string().optional(),
  notes: z.string().optional(),
  listingStatus: z.enum(["not_listed", "selling", "sold"]).optional(),
  listingPlatforms: z.array(z.string().max(80)).max(20).optional(),
  soldAt: z.string().optional(),
  soldWhere: z.string().max(500).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
})

type WantProductForm = z.infer<typeof wantProductSchema>
type HaveProductForm = z.infer<typeof haveProductSchema>

interface ProductDialogProps {
  open: boolean
  onClose: () => void
  type: ProductType
  product?: Product | null
  onProductUpdated?: () => void
}

export default function ProductDialog({
  open,
  onClose,
  type,
  product,
  onProductUpdated,
}: ProductDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const schema = type === "want" ? wantProductSchema : haveProductSchema

  const getToken = useCallback(
    () => user?.getIdToken() ?? Promise.resolve(null),
    [user]
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
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

  const [descEditorNonce, setDescEditorNonce] = useState(0)

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        brand: product.brand,
        brandId: product.brandId ?? "",
        website: product.website,
        originalPrice: product.originalPrice,
        date: product.date,
        description: product.description || "",
        category: product.category || "",
        model: product.model || "",
        sku: product.sku || "",
        color: product.color || "",
        size: product.size || "",
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
        ...(type === "have"
          ? { storeId: product.type === "have" && product.storeId ? product.storeId : "" }
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
        ...(type === "have" && product.type === "have"
          ? {
              listingStatus: getListingStatus(product),
              listingPlatforms: getListingPlatforms(product),
              soldAt: product.soldAt || "",
              soldWhere: product.soldWhere || "",
            }
          : {}),
        specifications: product.specifications ?? {},
      })
    } else {
      reset({
        name: "",
        brand: "",
        brandId: "",
        website: "",
        originalPrice: 0,
        date: new Date().toISOString().split("T")[0],
        description: "",
        category: "",
        model: "",
        sku: "",
        color: "",
        size: "",
        notes: "",
        ...(type === "want"
          ? { currentPrice: undefined, targetPrice: undefined }
          : {
              priceBought: 0,
              storeId: "",
              listingStatus: "not_listed",
              listingPlatforms: [],
              soldAt: "",
              soldWhere: "",
            }),
        specifications: {},
      })
    }
    setDescEditorNonce((n) => n + 1)
  }, [product, type, reset, open])

  const [stores, setStores] = useState<Store[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [storeCreateDialogOpen, setStoreCreateDialogOpen] = useState(false)
  const [brandCreateDialogOpen, setBrandCreateDialogOpen] = useState(false)
  const [storeCreateDraft, setStoreCreateDraft] = useState<
    StoreDialogProps["initialDraft"]
  >(null)

  const [imageEntries, setImageEntries] = useState<ProductImageEntry[]>([])

  useEffect(() => {
    if (!open || !user) return
    void (async () => {
      try {
        const b = await BrandService.getBrands(getToken)
        setBrands(b)
      } catch (e) {
        console.error("[ProductDialog] load brands:", e)
      }
    })()
  }, [open, user, getToken])

  useEffect(() => {
    if (!open || !user || type !== "have") return
    void (async () => {
      try {
        const list = await StoreService.getStores(getToken)
        setStores(list)
      } catch (e) {
        console.error("[ProductDialog] load stores:", e)
      }
    })()
  }, [open, user, type, getToken])

  useEffect(() => {
    setImageEntries(normalizeProductImages(product?.images))
  }, [product, open])

  const onSubmit = async (data: any) => {
    if (!user) return

    try {
      const filtered = Object.fromEntries(
        Object.entries(data as Record<string, unknown>).filter(
          ([_, v]) => v !== "" && v !== undefined
        )
      )

      const productData = {
        ...filtered,
        type,
        userId: user.uid,
        ...(type === "want"
          ? { currentPrice: data.currentPrice || data.originalPrice }
          : {}),
        ...(type === "have"
          ? {
              storeId: ((data as HaveProductForm).storeId || "").trim() || null,
            }
          : {}),
        images: sanitizeImageEntriesForSave(imageEntries),
      } as Omit<Product, "id" | "createdAt" | "updatedAt"> & Record<string, unknown>

      const brandIdTrim = String((data as { brandId?: string }).brandId ?? "").trim()
      if (brandIdTrim) {
        productData.brandId = brandIdTrim
      } else if (product?.id) {
        productData.brandId = null
      } else {
        delete (productData as Record<string, unknown>).brandId
      }

      if (type === "have") {
        const haveForm = data as HaveProductForm
        const status = haveForm.listingStatus ?? "not_listed"
        const platforms =
          status === "not_listed" ? [] : haveForm.listingPlatforms ?? []
        productData.listingStatus = status
        productData.listingPlatforms = platforms
        if (status === "sold") {
          const sa = (haveForm.soldAt || "").trim()
          const sw = (haveForm.soldWhere || "").trim()
          if (sa) productData.soldAt = sa
          else if (product?.id) (productData as Record<string, unknown>).soldAt = null
          else delete (productData as Record<string, unknown>).soldAt
          if (sw) productData.soldWhere = sw
          else if (product?.id) (productData as Record<string, unknown>).soldWhere = null
          else delete (productData as Record<string, unknown>).soldWhere
        } else if (product?.id) {
          ;(productData as Record<string, unknown>).soldAt = null
          ;(productData as Record<string, unknown>).soldWhere = null
        } else {
          delete (productData as Record<string, unknown>).soldAt
          delete (productData as Record<string, unknown>).soldWhere
        }
        if (product?.id) {
          ;(productData as Record<string, unknown>).isSelling = null
          ;(productData as Record<string, unknown>).sellingOn = null
        } else {
          delete (productData as Record<string, unknown>).isSelling
          delete (productData as Record<string, unknown>).sellingOn
        }
      }

      const specs = (data as HaveProductForm & WantProductForm).specifications
      if (
        specs &&
        typeof specs === "object" &&
        !Array.isArray(specs) &&
        Object.keys(specs).length === 0
      ) {
        if (!product?.id) delete productData.specifications
        else productData.specifications = {}
      }

      if (product?.id) {
        await ProductService.updateProduct(getToken, product.id, productData)
        toast({
          title: "Saved",
          description: "Product updated.",
        })
      } else {
        await ProductService.createProduct(getToken, productData)
        toast({
          title: "Added",
          description: "Product saved to your list.",
        })
      }
      onProductUpdated?.()
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      })
    }
  }

  const submitShortcut = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void handleSubmit(onSubmit)()
    }
  }

  const renderFormContent = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="name" className="text-base font-semibold">
              Product Name *
            </Label>
            <AiProductFieldAssist<WantProductForm | HaveProductForm>
              productType={type}
              fieldKey="name"
              shortLabel="Product name"
              getFormValues={() => watch()}
              setValue={setValue}
            />
          </div>
          <div className="flex gap-1 items-center">
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Apple iPad Pro 13 M5 WiFi"
              className="h-11 min-w-0 flex-1 text-base"
            />
            <CopyToClipboardButton
              value={copyFieldText(watch("name"))}
              label="Product name"
            />
          </div>
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="brand" className="text-base font-semibold">
              Brand *
            </Label>
            <AiProductFieldAssist<WantProductForm | HaveProductForm>
              productType={type}
              fieldKey="brand"
              shortLabel="Brand"
              getFormValues={() => watch()}
              setValue={setValue}
            />
          </div>
          <div className="flex gap-1 items-center">
            <Input
              id="brand"
              {...register("brand")}
              placeholder="e.g., Apple"
              className="h-11 min-w-0 flex-1 text-base"
            />
            <CopyToClipboardButton
              value={copyFieldText(watch("brand"))}
              label="Brand"
            />
          </div>
          {errors.brand && (
            <p className="text-sm text-red-500">{errors.brand.message as string}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="brandId" className="text-base font-semibold">
            Saved brand profile (optional)
          </Label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              id="brandId"
              className="flex h-11 min-w-[200px] max-w-md flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("brandId", {
                onChange: (e) => {
                  const id = (e.target as HTMLSelectElement).value
                  const b = brands.find((x) => x.id === id)
                  if (b) setValue("brand", b.name, { shouldDirty: true })
                },
              })}
            >
              <option value="">None</option>
              {brands.map((b) =>
                b.id ? (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ) : null
              )}
            </select>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setBrandCreateDialogOpen(true)}
            >
              New brand…
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Links this row to a normalised brand document. Manage all profiles under{" "}
            <strong>Dashboard → Brands</strong>.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="text-base font-semibold">Website URL *</Label>
          <div className="flex gap-1 items-center">
            <Input
              id="website"
              type="url"
              {...register("website")}
              placeholder="https://www.joybuy.co.uk/..."
              className="h-11 min-w-0 flex-1 text-base"
            />
            <CopyToClipboardButton
              value={copyFieldText(watch("website"))}
              label="Website URL"
            />
          </div>
          {errors.website && (
            <p className="text-sm text-red-500">{errors.website.message as string}</p>
          )}
          {(watch("website") || "").trim() && (
            <WebsiteLinkPreview url={String(watch("website"))} className="mt-2" />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="originalPrice" className="text-base font-semibold">Original Price (£) *</Label>
          <div className="flex gap-1 items-center">
            <Input
              id="originalPrice"
              type="number"
              step="0.01"
              {...register("originalPrice", { valueAsNumber: true })}
              className="h-11 min-w-0 flex-1 text-base"
            />
            <CopyToClipboardButton
              value={copyFieldText(watch("originalPrice"))}
              label="Original price"
            />
          </div>
          {errors.originalPrice && (
            <p className="text-sm text-red-500">
              {errors.originalPrice.message as string}
            </p>
          )}
        </div>

        {type === "want" && (
          <div className="space-y-2">
            <Label htmlFor="currentPrice" className="text-base font-semibold">Current Price (£) - Optional</Label>
            <div className="flex gap-1 items-center">
              <Input
                id="currentPrice"
                type="number"
                step="0.01"
                {...register("currentPrice", { valueAsNumber: true })}
                className="h-11 min-w-0 flex-1 text-base"
              />
              <CopyToClipboardButton
                value={copyFieldText(watch("currentPrice"))}
                label="Current price"
              />
            </div>
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
            <div className="flex gap-1 items-center">
              <Input
                id="priceBought"
                type="number"
                step="0.01"
                {...register("priceBought", { valueAsNumber: true })}
                className="h-11 min-w-0 flex-1 text-base"
              />
              <CopyToClipboardButton
                value={copyFieldText(watch("priceBought"))}
                label="Price bought"
              />
            </div>
            {"priceBought" in errors && (errors as any).priceBought && (
              <p className="text-sm text-red-500">
                {(errors as any).priceBought?.message as string}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="date" className="text-base font-semibold">Date *</Label>
          <div className="flex gap-1 items-center">
            <Input
              id="date"
              type="date"
              {...register("date")}
              className="h-11 min-w-0 flex-1 text-base"
            />
            <CopyToClipboardButton
              value={copyFieldText(watch("date"))}
              label="Date"
            />
          </div>
          {errors.date && (
            <p className="text-sm text-red-500">{errors.date.message as string}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3 md:col-span-2">
          <details className="group rounded-lg border border-input bg-card/30 open:shadow-sm" open>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              <span>Product description (rich text, optional)</span>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-2 border-t border-input px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Headings, lists, bold — safe HTML stored. Plain-text copy below.
                </p>
                <AiProductFieldAssist<WantProductForm | HaveProductForm>
                  productType={type}
                  fieldKey="description"
                  shortLabel="Description"
                  getFormValues={() => watch()}
                  setValue={setValue}
                />
              </div>
              <RichTextEditor
                key={`desc-${descEditorNonce}-${product?.id ?? "new"}-${type}`}
                initialHtml={watch("description") || ""}
                onChange={(html) =>
                  setValue("description", html, { shouldDirty: true, shouldValidate: true })
                }
                disabled={!user}
                placeholder="Marketing copy, feature bullets, warranty notes…"
              />
              <div className="flex justify-end">
                <CopyToClipboardButton
                  value={htmlToPlainText(String(watch("description") || ""))}
                  label="Copy description as plain text"
                />
              </div>
            </div>
          </details>

          <details className="group rounded-lg border border-input bg-card/30 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              <span>Technical specifications (optional)</span>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-input px-3 py-3">
              <ProductSpecificationsEditor
                value={
                  (watch("specifications") as Record<string, string> | undefined) ?? undefined
                }
                onChange={(next) =>
                  setValue("specifications", next ?? {}, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                disabled={!user}
              />
            </div>
          </details>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-base font-semibold">Category (Optional)</Label>
          <div className="flex gap-1 items-center">
            <Input
              id="category"
              {...register("category")}
              placeholder="e.g., Electronics"
              className="h-11 min-w-0 flex-1 text-base"
            />
            <CopyToClipboardButton
              value={copyFieldText(watch("category"))}
              label="Category"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="model" className="text-base font-semibold">Model (Optional)</Label>
          <div className="flex gap-1 items-center">
            <Input
              id="model"
              {...register("model")}
              placeholder="e.g., iPad Pro 13-inch"
              className="h-11 min-w-0 flex-1 text-base"
            />
            <CopyToClipboardButton
              value={copyFieldText(watch("model"))}
              label="Model"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku" className="text-base font-semibold">SKU (Optional)</Label>
          <div className="flex gap-1 items-center">
            <Input
              id="sku"
              {...register("sku")}
              placeholder="e.g., 10451022"
              className="h-11 min-w-0 flex-1 text-base"
            />
            <CopyToClipboardButton value={copyFieldText(watch("sku"))} label="SKU" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="color" className="text-base font-semibold">Color (Optional)</Label>
          <div className="flex gap-1 items-center">
            <Input
              id="color"
              {...register("color")}
              placeholder="e.g., Space Gray"
              className="h-11 min-w-0 flex-1 text-base"
            />
            <CopyToClipboardButton value={copyFieldText(watch("color"))} label="Color" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="size" className="text-base font-semibold">Size (Optional)</Label>
          <div className="flex gap-1 items-center">
            <Input
              id="size"
              {...register("size")}
              placeholder="e.g., 256GB"
              className="h-11 min-w-0 flex-1 text-base"
            />
            <CopyToClipboardButton value={copyFieldText(watch("size"))} label="Size" />
          </div>
        </div>

        {type === "want" && (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="targetPrice" className="text-base font-semibold">Target Price (£) - Optional</Label>
            <div className="flex gap-1 items-center">
              <Input
                id="targetPrice"
                type="number"
                step="0.01"
                {...register("targetPrice", { valueAsNumber: true })}
                placeholder="Price you want to buy at"
                className="h-11 min-w-0 flex-1 text-base"
              />
              <CopyToClipboardButton
                value={copyFieldText(watch("targetPrice"))}
                label="Target price"
              />
            </div>
          </div>
        )}

        {type === "have" && (
          <>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="storeId" className="text-base font-semibold">
                Saved store profile (optional)
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <select
                  id="storeId"
                  className="flex h-11 min-w-[220px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register("storeId")}
                >
                  <option value="">None — use free text below if needed</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStoreCreateDraft(null)
                      setStoreCreateDialogOpen(true)
                    }}
                  >
                    New store…
                  </Button>
                  {product?.type === "have" && product.receiptId && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        void (async () => {
                          const r = await ReceiptService.getReceipt(
                            getToken,
                            product.receiptId!
                          )
                          if (!r) {
                            toast({
                              title: "Receipt not found",
                              description: "Could not load the linked receipt.",
                              variant: "destructive",
                            })
                            return
                          }
                          setStoreCreateDraft(storeDraftFromReceipt(r))
                          setStoreCreateDialogOpen(true)
                        })()
                      }}
                    >
                      From linked receipt
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Manage stores under the Stores tab. “From linked receipt” pre-fills from the receipt’s store fields.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="purchaseLocation" className="text-base font-semibold">
                Purchase location — free text (optional)
              </Label>
              <div className="flex gap-1 items-center">
                <Input
                  id="purchaseLocation"
                  {...register("purchaseLocation")}
                  placeholder="e.g., Apple Store"
                  className="h-11 min-w-0 flex-1 text-base"
                />
                <CopyToClipboardButton
                  value={copyFieldText(watch("purchaseLocation"))}
                  label="Purchase location"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="warrantyExpiry" className="text-base font-semibold">Warranty Expiry (Optional)</Label>
              <div className="flex gap-1 items-center">
                <Input
                  id="warrantyExpiry"
                  type="date"
                  {...register("warrantyExpiry")}
                  className="h-11 min-w-0 flex-1 text-base"
                />
                <CopyToClipboardButton
                  value={copyFieldText(watch("warrantyExpiry"))}
                  label="Warranty expiry"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition" className="text-base font-semibold">Condition (Optional)</Label>
              <div className="flex gap-1 items-center">
                <Input
                  id="condition"
                  {...register("condition")}
                  placeholder="e.g., New, Good"
                  className="h-11 min-w-0 flex-1 text-base"
                />
                <CopyToClipboardButton
                  value={copyFieldText(watch("condition"))}
                  label="Condition"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {type === "have" && (
        <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="rounded-lg border border-blue-200/70 bg-blue-50/50 p-3 text-sm text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-50">
            <p className="font-medium">Resale listing</p>
            <p className="mt-1 text-xs leading-relaxed opacity-90 sm:text-sm">
              Set status to <strong>Selling</strong> and tick every marketplace you use. When sold, pick{" "}
              <strong>Sold</strong> and record when and where. Use{" "}
              <Link
                href="/sell-compare"
                className="font-semibold underline underline-offset-2 hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                price compare
              </Link>{" "}
              as a rough guide — confirm on the live site before you price.
            </p>
            <Button type="button" variant="secondary" size="sm" className="mt-2" asChild>
              <Link href="/sell-compare" target="_blank" rel="noopener noreferrer">
                <Scale className="mr-2 h-4 w-4" aria-hidden />
                Open compare hub
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="listingStatus" className="text-base font-semibold">
                Listing status
              </Label>
              <select
                id="listingStatus"
                className="flex h-11 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("listingStatus")}
              >
                <option value="not_listed">Not listed</option>
                <option value="selling">Selling</option>
                <option value="sold">Sold</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Replaces the old “currently selling” checkbox — saved to Firestore as{" "}
                <code className="rounded bg-muted px-1">listingStatus</code>.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-base font-semibold">Listed on (multiple)</Label>
              <Controller
                name="listingPlatforms"
                control={control}
                render={({ field }) => (
                  <ListingPlatformsMultiSelect
                    value={field.value ?? []}
                    onChange={field.onChange}
                    disabled={watch("listingStatus") === "not_listed"}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                Checkboxes match common UK resale channels. Ignored when status is “Not listed”.
              </p>
            </div>
            {watch("listingStatus") === "sold" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="soldAt" className="text-base font-semibold">
                    Sold when
                  </Label>
                  <div className="flex gap-1 items-center">
                    <Input id="soldAt" type="date" {...register("soldAt")} className="h-11 min-w-0 flex-1" />
                    <CopyToClipboardButton value={copyFieldText(watch("soldAt"))} label="Sold date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="soldWhere" className="text-base font-semibold">
                    Sold where
                  </Label>
                  <div className="flex gap-1 items-center">
                    <Input
                      id="soldWhere"
                      {...register("soldWhere")}
                      placeholder="e.g. Gumtree — collected cash"
                      className="h-11 min-w-0 flex-1 text-base"
                    />
                    <CopyToClipboardButton value={copyFieldText(watch("soldWhere"))} label="Sold where" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2 pt-2">
        <p className="text-xs text-muted-foreground sm:text-sm">
          <span className="font-medium text-foreground">Photos:</span> the first image is the main thumbnail in your
          list. Add shots of condition, serial number, and box — buyers expect these on resale sites.
        </p>
        <ImageUpload
          images={imageEntries}
          onImagesChange={setImageEntries}
          maxImages={12}
          folder="products"
          userId={user?.uid || ""}
          disabled={!user}
          allowTags
          allowReorder
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="notes" className="text-base font-semibold">
            Notes (Optional)
          </Label>
          <AiProductFieldAssist<WantProductForm | HaveProductForm>
            productType={type}
            fieldKey="notes"
            shortLabel="Notes"
            getFormValues={() => watch()}
            setValue={setValue}
          />
        </div>
        <div className="flex gap-1 items-center">
          <Input
            id="notes"
            {...register("notes")}
            placeholder="Additional notes about this product..."
            className="h-11 min-w-0 flex-1 text-base"
          />
          <CopyToClipboardButton
            value={copyFieldText(watch("notes"))}
            label="Notes"
          />
        </div>
      </div>

      <DialogFooter className="border-t border-gray-200 pt-4 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[140px] px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : product ? (
            "Save changes"
          ) : (
            "Add product"
          )}
        </Button>
      </DialogFooter>
    </>
  )

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSubmitting) {
      onClose()
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="flex max-h-[95vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[900px] lg:max-w-[1000px]"
        onPointerDownOutside={(e) => {
          if (isSubmitting) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) e.preventDefault()
        }}
      >
        <div className="px-6 pt-6 pb-2">
          <DialogHeader>
            <DialogTitle>
              {product ? "Edit product" : type === "want" ? "Add something you want" : "Add something you own"}
            </DialogTitle>
            <DialogDescription className="text-left text-sm leading-relaxed">
              {product ? (
                <>
                  Changes apply when you tap Save.{" "}
                  <span className="text-muted-foreground">Ctrl+Enter (⌘+Enter on Mac) saves.</span>
                </>
              ) : type === "have" ? (
                <>
                  Log something you own before you list it: retail URL, photos, optional store profile, then mark
                  &quot;Currently selling&quot; when it goes live on Gumtree, Vinted, eBay, etc.{" "}
                  <span className="text-muted-foreground">Ctrl+Enter (⌘+Enter) saves.</span>
                </>
              ) : (
                <>
                  Track something you want to buy: paste a product page URL, set prices, and optional target. Product
                  lookup can fill in details.{" "}
                  <span className="text-muted-foreground">Ctrl+Enter (⌘+Enter) saves.</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>
        {product ? (
          <Tabs defaultValue="details" className="flex min-h-0 flex-1 flex-col px-6">
            <TabsList className="grid w-full shrink-0 grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">Price history</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4 min-h-0 flex-1 space-y-6 overflow-y-auto pb-4">
              <form
                onSubmit={handleSubmit(onSubmit)}
                onKeyDown={submitShortcut}
                className="space-y-6"
              >
                {renderFormContent()}
              </form>
            </TabsContent>
            <TabsContent value="history" className="mt-4 space-y-6 overflow-y-auto pb-6">
              {product.id && (
                <PriceHistoryComponent
                  productId={product.id}
                  priceHistory={product.priceHistory || []}
                  currentPrice={product.type === "want" ? product.currentPrice : undefined}
                  originalPrice={product.originalPrice}
                  website={product.website}
                  onPriceHistoryAdded={() => {
                    onProductUpdated?.()
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={submitShortcut}
            className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto px-6 pb-6 pt-2"
          >
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
                    specifications:
                      lookupResult.specifications ??
                      (currentValues as { specifications?: Record<string, string> })
                        .specifications ??
                      {},
                    ...(type === "have"
                      ? {
                          listingStatus:
                            (currentValues as HaveProductForm).listingStatus ?? "not_listed",
                          listingPlatforms:
                            (currentValues as HaveProductForm).listingPlatforms ?? [],
                          soldAt: (currentValues as HaveProductForm).soldAt ?? "",
                          soldWhere: (currentValues as HaveProductForm).soldWhere ?? "",
                        }
                      : {}),
                  })
                  setDescEditorNonce((n) => n + 1)
                  if (lookupResult.images && lookupResult.images.length > 0) {
                    setImageEntries(normalizeProductImages(lookupResult.images))
                  }
                }}
                websiteUrl={watch("website")}
              />
            )}
            {renderFormContent()}
          </form>
        )}
      </DialogContent>
    </Dialog>
    <StoreDialog
      open={storeCreateDialogOpen}
      onClose={() => {
        setStoreCreateDialogOpen(false)
        setStoreCreateDraft(null)
      }}
      store={null}
      initialDraft={storeCreateDraft ?? undefined}
      onSaved={async (createdId) => {
        try {
          const list = await StoreService.getStores(getToken)
          setStores(list)
          if (createdId) {
            setValue("storeId", createdId)
          }
        } catch (e) {
          console.error(e)
        }
      }}
    />
    <BrandDialog
      open={brandCreateDialogOpen}
      onClose={() => setBrandCreateDialogOpen(false)}
      brand={null}
      onSaved={async (createdId) => {
        try {
          const list = await BrandService.getBrands(getToken)
          setBrands(list)
          if (createdId) {
            setValue("brandId", createdId, { shouldDirty: true })
            const nb = list.find((x) => x.id === createdId)
            if (nb) setValue("brand", nb.name, { shouldDirty: true })
          }
        } catch (e) {
          console.error(e)
        }
      }}
    />
    </>
  )
}

