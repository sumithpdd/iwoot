"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Product, ProductType } from "@/lib/types/product"
import { getProducts } from "@/lib/firebase/products"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, LogOut, Settings, Search, Grid3x3, List } from "lucide-react"
import ProductList from "@/components/product-list"
import ProductDialog from "@/components/product-dialog"
import ReceiptList from "@/components/receipt-list"
import ReceiptDialog from "@/components/receipt-dialog"
import { Toaster } from "@/components/ui/toaster"
import { Receipt } from "@/lib/types/receipt"
import { getReceipts } from "@/lib/firebase/receipts"
import Link from "next/link"
import SearchBar from "@/components/search-bar"

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<ProductType>("want")
  const [activeTab, setActiveTab] = useState<string>("products")
  const [productFilter, setProductFilter] = useState<"all" | "want" | "have">("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

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

  const loadProducts = useCallback(async () => {
    if (!user) {
      setError("No user found. Please log in.")
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      console.log("[Dashboard] Loading products for user:", user.uid)
      
      // Add timeout to the query itself (reduced to 5 seconds)
      const timeoutPromise = new Promise<Product[]>((_, reject) => 
        setTimeout(() => {
          console.error("[Dashboard] Query timeout after 5 seconds")
          reject(new Error("Query timeout after 5 seconds. Check Firestore connection and rules."))
        }, 5000)
      )
      
      const data = await Promise.race([
        getProducts(user.uid),
        timeoutPromise
      ])
      
      console.log("[Dashboard] Products loaded successfully:", data.length)
      setProducts(data)
    } catch (error: any) {
      console.error("[Dashboard] Error loading products:", error)
      const errorMessage = error.message || "Failed to load products. Please check your Firebase configuration and Firestore rules."
      setError(errorMessage)
      // Set empty array on error so UI can still render
      setProducts([])
    } finally {
      console.log("[Dashboard] Setting loading to false")
      setLoading(false)
    }
  }, [user])

  const loadReceipts = useCallback(async () => {
    if (!user) return
    try {
      const data = await getReceipts(user.uid)
      setReceipts(data)
    } catch (error: any) {
      console.error("Error loading receipts:", error)
    }
  }, [user])

  useEffect(() => {
    if (user && !authLoading) {
      loadProducts()
      loadReceipts()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading, loadProducts, loadReceipts])

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
    loadProducts()
  }

  const handleOpenReceiptDialog = (receipt?: Receipt) => {
    setEditingReceipt(receipt || null)
    setReceiptDialogOpen(true)
  }

  const handleCloseReceiptDialog = () => {
    setReceiptDialogOpen(false)
    setEditingReceipt(null)
    loadReceipts()
    loadProducts() // Reload products in case receipt links were updated
  }

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

  // Filter products by search query and type filter
  const filterProducts = (productList: Product[]) => {
    let filtered = productList
    
    // Apply type filter
    if (productFilter === "want") {
      filtered = filtered.filter((p) => p.type === "want")
    } else if (productFilter === "have") {
      filtered = filtered.filter((p) => p.type === "have")
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.model?.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }

  const filteredProducts = filterProducts(products)
  const wantProducts = products.filter((p) => p.type === "want")
  const haveProducts = products.filter((p) => p.type === "have")

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Toaster />
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                IWOOT
              </h1>
            </div>
            <div className="flex items-center space-x-3">
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
                loadProducts()
              }}
            >
              Retry
            </Button>
          </div>
        )}
        <Tabs defaultValue="products" onValueChange={handleTabChange} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-white dark:bg-gray-800 shadow-sm">
              <TabsTrigger value="products" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Products ({products.length})
              </TabsTrigger>
              <TabsTrigger value="receipts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
                Receipts ({receipts.length})
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => {
                  if (activeTab === "receipts") {
                    handleOpenReceiptDialog()
                  } else {
                    handleOpenDialog(selectedType)
                  }
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                {activeTab === "receipts" ? "Add Receipt" : "Add Product"}
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
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ProductList
                  products={filteredProducts}
                  type={productFilter === "have" ? "have" : productFilter === "want" ? "want" : "want"}
                  viewMode={viewMode}
                  onEdit={(product) => handleOpenDialog(product.type, product)}
                  onDelete={loadProducts}
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
                  onDelete={loadReceipts}
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
        />

        <ReceiptDialog
          open={receiptDialogOpen}
          onClose={handleCloseReceiptDialog}
          receipt={editingReceipt}
        />
      </main>
    </div>
  )
}

