"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Product, ProductType } from "@/lib/types/product"
import type { Store } from "@/lib/types/store"
import type { Brand } from "@/lib/types/brand"
import { ProductService } from "@/lib/services/product.service"
import { ReceiptService } from "@/lib/services/receipt.service"
import { StoreService } from "@/lib/services/store.service"
import { BrandService } from "@/lib/services/brand.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, LogOut, Settings, Search, Grid3x3, List, Building2, Scale, Tags } from "lucide-react"
import ProductList from "@/components/product-list"
import ProductDialog from "@/components/product-dialog"
import ReceiptList from "@/components/receipt-list"
import ReceiptDialog from "@/components/receipt-dialog"
import StoreList from "@/components/store-list"
import StoreDialog from "@/components/store-dialog"
import BrandList from "@/components/brand-list"
import BrandDialog from "@/components/brand-dialog"
import { Toaster } from "@/components/ui/toaster"
import { Receipt } from "@/lib/types/receipt"
import Link from "next/link"
import SearchBar from "@/components/search-bar"
import { AiChatPanel } from "@/components/ai-chat-panel"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  filterProductsByPriceBand,
  sortProducts,
  type ProductSortOption,
  type ProductPriceBand,
} from "@/lib/utils/product-list-utils"
import { htmlToPlainText } from "@/lib/utils/html-plain-text"
import { getListingPlatforms } from "@/lib/utils/product-listing"
import { SellingJourneyCard } from "@/components/selling-journey-card"
import { SuggestedStoresSeed } from "@/components/suggested-stores-seed"

function productMatchesSearch(p: Product, query: string): boolean {
  const haystack = [
    p.name,
    p.brand,
    p.category,
    htmlToPlainText(p.description ?? ""),
    p.model,
    p.sku,
  ]
  if (p.specifications) {
    for (const [k, v] of Object.entries(p.specifications)) {
      haystack.push(k, String(v))
    }
  }
  if (p.type === "have") {
    haystack.push(
      p.listingStatus,
      p.soldWhere,
      p.soldAt,
      p.sellingOn,
      ...getListingPlatforms(p)
    )
  }
  const flat = haystack.filter(Boolean).join(" ").toLowerCase()
  return flat.includes(query)
}

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [storeDialogOpen, setStoreDialogOpen] = useState(false)
  const [brandDialogOpen, setBrandDialogOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [selectedType, setSelectedType] = useState<ProductType>("want")
  const [activeTab, setActiveTab] = useState<string>("products")
  const [productFilter, setProductFilter] = useState<"all" | "want" | "have">("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [productSort, setProductSort] = useState<ProductSortOption>("updated-desc")
  const [priceBand, setPriceBand] = useState<ProductPriceBand>("all")

  const getToken = useCallback(
    () => user?.getIdToken() ?? Promise.resolve(null),
    [user]
  )

  // Timeout to prevent infinite loading (increased to 15 seconds to allow query timeout to trigger first)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !authLoading) {
        console.warn("[Dashboard] Loading timeout - forcing stop after 15 seconds")
        setError("Loading is taking longer than expected. Check browser console for detailed errors. The query may be hanging or Firestore may not be accessible.")
        setLoading(false)
        setProducts([]) // Set empty to allow UI to render
      }
    }, 15000) // 15 second timeout (query timeout is 5 seconds, so this is a fallback)

    return () => clearTimeout(timeout)
  }, [loading, authLoading])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const loadProducts = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true
      if (!user) {
        setError("No user found. Please log in.")
        if (!silent) setLoading(false)
        return
      }
      try {
        if (!silent) {
          setLoading(true)
        }
        setError(null)

        const data = await ProductService.getProducts(getToken)
        setProducts(data)
      } catch (error: unknown) {
        console.error("[Dashboard] Error loading products:", error)
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load products. Please check your Firebase configuration and Firestore rules."
        setError(errorMessage)
        setProducts([])
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    [user, getToken]
  )

  const loadReceipts = useCallback(async () => {
    if (!user) return
    try {
      const data = await ReceiptService.getReceipts(getToken)
      setReceipts(data)
    } catch (error: any) {
      console.error("Error loading receipts:", error)
    }
  }, [user, getToken])

  const loadStores = useCallback(async () => {
    if (!user) return
    try {
      const data = await StoreService.getStores(getToken)
      setStores(data)
    } catch (e) {
      console.error("[Dashboard] load stores:", e)
    }
  }, [user, getToken])

  const loadBrands = useCallback(async () => {
    if (!user) return
    try {
      const data = await BrandService.getBrands(getToken)
      setBrands(data)
    } catch (e) {
      console.error("[Dashboard] load brands:", e)
    }
  }, [user, getToken])

  useEffect(() => {
    if (user && !authLoading) {
      loadProducts()
      loadReceipts()
      void loadStores()
      void loadBrands()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading, loadProducts, loadReceipts, loadStores, loadBrands])

  const handleOpenDialog = (type: ProductType, product?: Product) => {
    setSelectedType(type)
    setEditingProduct(product || null)
    setDialogOpen(true)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingProduct(null)
  }

  const handleOpenReceiptDialog = (receipt?: Receipt) => {
    setEditingReceipt(receipt || null)
    setReceiptDialogOpen(true)
  }

  const handleCloseReceiptDialog = () => {
    setReceiptDialogOpen(false)
    setEditingReceipt(null)
  }

  const refreshAfterReceiptSave = useCallback(() => {
    void loadReceipts()
    void loadProducts({ silent: true })
    void loadStores()
    void loadBrands()
  }, [loadReceipts, loadProducts, loadStores, loadBrands])

  const filteredProducts = useMemo(() => {
    let filtered = products
    if (productFilter === "want") {
      filtered = filtered.filter((p) => p.type === "want")
    } else if (productFilter === "have") {
      filtered = filtered.filter((p) => p.type === "have")
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((p) => productMatchesSearch(p, query))
    }
    return filtered
  }, [products, productFilter, searchQuery])

  const displayProducts = useMemo(
    () => sortProducts(filterProductsByPriceBand(filteredProducts, priceBand), productSort),
    [filteredProducts, priceBand, productSort]
  )

  const wantProducts = useMemo(
    () => products.filter((p) => p.type === "want"),
    [products]
  )
  const haveProducts = useMemo(
    () => products.filter((p) => p.type === "have"),
    [products]
  )

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Toaster />
      <AiChatPanel />
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                IWOOT
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/sell-compare">
                <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Scale className="mr-2 h-4 w-4" />
                  Sell compare
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                setError(null)
                void loadProducts()
              }}
            >
              Retry
            </Button>
          </div>
        )}

        <div className="mb-8">
          <SellingJourneyCard
            storeCount={stores.length}
            haveProductCount={haveProducts.length}
            receiptCount={receipts.length}
            onOpenStoresTab={() => {
              setActiveTab("stores")
            }}
            onOpenAddStore={() => {
              setActiveTab("stores")
              setEditingStore(null)
              setStoreDialogOpen(true)
            }}
            onOpenHaveProduct={() => {
              setActiveTab("products")
              setProductFilter("have")
              handleOpenDialog("have")
            }}
            onOpenReceiptsTab={() => {
              setActiveTab("receipts")
            }}
          />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-white dark:bg-gray-800 shadow-sm">
              <TabsTrigger value="products" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Products ({products.length})
              </TabsTrigger>
              <TabsTrigger value="receipts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
                Receipts ({receipts.length})
              </TabsTrigger>
              <TabsTrigger value="stores" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                <Building2 className="inline h-4 w-4 mr-1 align-text-bottom" aria-hidden />
                Stores ({stores.length})
              </TabsTrigger>
              <TabsTrigger value="brands" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white">
                <Tags className="inline h-4 w-4 mr-1 align-text-bottom" aria-hidden />
                Brands ({brands.length})
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => {
                  if (activeTab === "receipts") {
                    handleOpenReceiptDialog()
                  } else if (activeTab === "stores") {
                    setEditingStore(null)
                    setStoreDialogOpen(true)
                  } else if (activeTab === "brands") {
                    setEditingBrand(null)
                    setBrandDialogOpen(true)
                  } else {
                    handleOpenDialog(selectedType)
                  }
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                {activeTab === "receipts"
                  ? "Add Receipt"
                  : activeTab === "stores"
                    ? "Add Store"
                    : activeTab === "brands"
                      ? "Add Brand"
                      : "Add Product"}
              </Button>
            </div>
          </div>

          <TabsContent value="products" className="space-y-6">
            {/* Filter Buttons, Search, and View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex gap-2">
                <Button
                  variant={productFilter === "all" ? "default" : "outline"}
                  onClick={() => setProductFilter("all")}
                  className={productFilter === "all" ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" : ""}
                >
                  All ({products.length})
                </Button>
                <Button
                  variant={productFilter === "want" ? "default" : "outline"}
                  onClick={() => setProductFilter("want")}
                  className={productFilter === "want" ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" : ""}
                >
                  I Want ({wantProducts.length})
                </Button>
                <Button
                  variant={productFilter === "have" ? "default" : "outline"}
                  onClick={() => setProductFilter("have")}
                  className={productFilter === "have" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : ""}
                >
                  I Have ({haveProducts.length})
                </Button>
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search products by name, brand, category..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" : ""}
                  title="Grid View"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                  className={viewMode === "table" ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" : ""}
                  title="Table View"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex flex-col gap-1 min-w-[200px] sm:max-w-[240px]">
                <span className="text-xs text-muted-foreground">Sort by</span>
                <Select
                  value={productSort}
                  onValueChange={(v) => setProductSort(v as ProductSortOption)}
                >
                  <SelectTrigger className="h-10 bg-white dark:bg-gray-900">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated-desc">Last updated (newest)</SelectItem>
                    <SelectItem value="updated-asc">Last updated (oldest)</SelectItem>
                    <SelectItem value="created-desc">Created (newest)</SelectItem>
                    <SelectItem value="created-asc">Created (oldest)</SelectItem>
                    <SelectItem value="purchase-desc">Purchase / list date (newest)</SelectItem>
                    <SelectItem value="purchase-asc">Purchase / list date (oldest)</SelectItem>
                    <SelectItem value="name-asc">Name (A–Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z–A)</SelectItem>
                    <SelectItem value="price-desc">Price (high to low)</SelectItem>
                    <SelectItem value="price-asc">Price (low to high)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1 min-w-[200px] sm:max-w-[240px]">
                <span className="text-xs text-muted-foreground">Filter by price / history</span>
                <Select
                  value={priceBand}
                  onValueChange={(v) => setPriceBand(v as ProductPriceBand)}
                >
                  <SelectTrigger className="h-10 bg-white dark:bg-gray-900">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All products</SelectItem>
                    <SelectItem value="under50">Price under £50</SelectItem>
                    <SelectItem value="50to200">Price £50–£200</SelectItem>
                    <SelectItem value="over200">Price over £200</SelectItem>
                    <SelectItem value="hasHistory">Has price history</SelectItem>
                    <SelectItem value="noHistory">No price history</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(priceBand !== "all" || productSort !== "updated-desc") && (
                <p className="text-sm text-muted-foreground sm:ml-auto">
                  Showing {displayProducts.length} of {filteredProducts.length}
                </p>
              )}
            </div>

            {/* Products List */}
            <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {productFilter === "all" && "All Products"}
                  {productFilter === "want" && "Products I Want"}
                  {productFilter === "have" && "Products I Have"}
                </CardTitle>
                <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                  {productFilter === "all" && "All your tracked products"}
                  {productFilter === "want" && "Track prices for products you want to buy"}
                  {productFilter === "have" && "Track prices for products you own"}
                  {searchQuery && (
                    <span className="block mt-1 text-sm text-blue-600 dark:text-blue-400">
                      Found {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} matching &quot;{searchQuery}&quot;
                    </span>
                  )}
                  {priceBand !== "all" && !searchQuery && (
                    <span className="block mt-1 text-sm text-muted-foreground">
                      {displayProducts.length} product{displayProducts.length !== 1 ? "s" : ""} after price / history filter
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ProductList
                  products={displayProducts}
                  type={
                    productFilter === "all"
                      ? "all"
                      : productFilter === "have"
                        ? "have"
                        : "want"
                  }
                  viewMode={viewMode}
                  viewerEmail={user?.email ?? null}
                  stores={stores}
                  onEdit={(product) => handleOpenDialog(product.type, product)}
                  onDelete={() => void loadProducts({ silent: true })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Receipts</CardTitle>
                <CardDescription>
                  Manage your purchase receipts and link them to products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReceiptList
                  receipts={receipts}
                  onEdit={handleOpenReceiptDialog}
                  onDelete={() => void loadReceipts()}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stores" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Stores</CardTitle>
                    <CardDescription>
                      Retailers and locations you buy from. Link them to receipts and “I have” products;
                      receipt store fields can prefill a new profile.
                    </CardDescription>
                  </div>
                  <SuggestedStoresSeed stores={stores} onSeeded={() => void loadStores()} />
                </div>
              </CardHeader>
              <CardContent>
                <StoreList
                  stores={stores}
                  onChanged={() => void loadStores()}
                  onEdit={(s) => {
                    setEditingStore(s)
                    setStoreDialogOpen(true)
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brands" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Brands</CardTitle>
                <CardDescription>
                  Normalised manufacturer or label profiles (e.g. Apple). Link them from any product via{" "}
                  <strong>Saved brand profile</strong> in the product form.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BrandList
                  brands={brands}
                  onChanged={() => void loadBrands()}
                  onEdit={(b) => {
                    setEditingBrand(b)
                    setBrandDialogOpen(true)
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ProductDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          type={selectedType}
          product={editingProduct}
          onProductUpdated={() => {
            void loadProducts({ silent: true })
            void loadStores()
            void loadBrands()
          }}
        />

        <ReceiptDialog
          open={receiptDialogOpen}
          onClose={handleCloseReceiptDialog}
          onSaved={refreshAfterReceiptSave}
          receipt={editingReceipt}
        />

        <StoreDialog
          open={storeDialogOpen}
          onClose={() => {
            setStoreDialogOpen(false)
            setEditingStore(null)
          }}
          store={editingStore}
          onSaved={() => void loadStores()}
        />

        <BrandDialog
          open={brandDialogOpen}
          onClose={() => {
            setBrandDialogOpen(false)
            setEditingBrand(null)
          }}
          brand={editingBrand}
          onSaved={() => void loadBrands()}
        />
      </main>
    </div>
  )
}

