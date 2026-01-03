"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { lookupProduct, lookupProductByUrl, ProductLookupResult } from "@/lib/services/product-lookup.service"
import { useToast } from "@/hooks/use-toast"

interface ProductLookupProps {
  onProductFound: (product: ProductLookupResult) => void
  websiteUrl?: string
}

export default function ProductLookup({ onProductFound, websiteUrl }: ProductLookupProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [lastResult, setLastResult] = useState<ProductLookupResult | null>(null)
  const { toast } = useToast()

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product name or barcode",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    setLastResult(null)

    try {
      const result = await lookupProduct(searchQuery.trim())
      
      if (result) {
        setLastResult(result)
        onProductFound(result)
        toast({
          title: "Product Found!",
          description: "Product information has been filled in. Review and adjust as needed.",
        })
      } else {
        toast({
          title: "Product Not Found",
          description: "Could not find product information. Please fill in the details manually.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Product lookup error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to lookup product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleUrlLookup = async () => {
    if (!websiteUrl) {
      toast({
        title: "Error",
        description: "Please enter a website URL first",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    setLastResult(null)

    try {
      const result = await lookupProductByUrl(websiteUrl)
      
      if (result) {
        setLastResult(result)
        onProductFound(result)
        toast({
          title: "Product Info Extracted",
          description: "Product information has been filled in from the URL.",
        })
      } else {
        toast({
          title: "Could Not Extract Info",
          description: "Could not extract product information from URL. Please fill in manually.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("URL lookup error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to extract product information from URL.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <Label className="text-base font-semibold text-gray-900 dark:text-white">
          Auto-Fill Product Details
        </Label>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="product-search" className="text-sm text-gray-600 dark:text-gray-400">
          Search by product name or barcode/UPC
        </Label>
        <div className="flex gap-2">
          <Input
            id="product-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSearching) {
                handleSearch()
              }
            }}
            placeholder="e.g., 'iPad Pro' or '0123456789012'"
            className="flex-1 h-10"
            disabled={isSearching}
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>
      </div>

      {websiteUrl && (
        <div className="space-y-2">
          <Label className="text-sm text-gray-600 dark:text-gray-400">
            Or extract info from the website URL
          </Label>
          <Button
            onClick={handleUrlLookup}
            disabled={isSearching || !websiteUrl}
            variant="outline"
            className="w-full"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              "Extract from URL"
            )}
          </Button>
        </div>
      )}

      {lastResult && (
        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-800 dark:text-green-300">
            Product information loaded: {lastResult.name || "Unknown"}
          </span>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
        <p>💡 Tip: Enter a product name, barcode, or UPC code to automatically fill in product details.</p>
        <p className="mt-1">Powered by UPCitemdb (free product database)</p>
      </div>
    </div>
  )
}

