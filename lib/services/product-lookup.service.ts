/**
 * Product Lookup Service
 * 
 * Fetches product information from external APIs to auto-fill product details.
 * Uses UPCitemdb (free, no API key required) for product lookups.
 */

export interface ProductLookupResult {
  name?: string
  brand?: string
  description?: string
  category?: string
  model?: string
  sku?: string
  images?: string[]
  price?: number
  website?: string
  specifications?: Record<string, string>
}

/**
 * Search for a product by name or barcode/UPC
 * @param query - Product name, barcode, or UPC code
 * @returns Product information or null if not found
 */
export async function lookupProduct(query: string): Promise<ProductLookupResult | null> {
  if (!query || query.trim().length === 0) {
    return null
  }

  // Try barcode/UPC lookup first (if query is numeric)
  if (/^\d+$/.test(query.trim())) {
    const barcodeResult = await lookupByBarcode(query.trim())
    if (barcodeResult) {
      return barcodeResult
    }
  }

  // Try product name search
  const searchResult = await searchProductByName(query.trim())
  if (searchResult) {
    return searchResult
  }

  return null
}

/**
 * Lookup product by barcode/UPC using UPCitemdb
 * @param barcode - Barcode or UPC code
 * @returns Product information or null
 */
async function lookupByBarcode(barcode: string): Promise<ProductLookupResult | null> {
  try {
    // UPCitemdb free API (no key required)
    const response = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      }
    )

    if (!response.ok) {
      console.warn(`[Product Lookup] Barcode lookup failed: ${response.status}`)
      return null
    }

    const data = await response.json()
    
    if (data.code === "OK" && data.items && data.items.length > 0) {
      const item = data.items[0]
      
      return {
        name: item.title || item.description,
        brand: item.brand,
        description: item.description,
        category: item.category,
        images: item.images && item.images.length > 0 ? item.images : undefined,
        price: item.lowest_recorded_price || item.highest_recorded_price,
        website: item.offers && item.offers.length > 0 ? item.offers[0].link : undefined,
        specifications: item.specs || undefined,
      }
    }

    return null
  } catch (error) {
    console.error("[Product Lookup] Error fetching barcode data:", error)
    return null
  }
}

/**
 * Search for product by name using UPCitemdb
 * @param productName - Product name to search
 * @returns Product information or null
 */
async function searchProductByName(productName: string): Promise<ProductLookupResult | null> {
  try {
    // UPCitemdb search API
    const response = await fetch(
      `https://api.upcitemdb.com/prod/trial/search?s=${encodeURIComponent(productName)}&match_mode=0&type=product`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      }
    )

    if (!response.ok) {
      console.warn(`[Product Lookup] Product search failed: ${response.status}`)
      return null
    }

    const data = await response.json()
    
    if (data.code === "OK" && data.items && data.items.length > 0) {
      // Return the first result
      const item = data.items[0]
      
      return {
        name: item.title || item.description,
        brand: item.brand,
        description: item.description,
        category: item.category,
        images: item.images && item.images.length > 0 ? item.images : undefined,
        price: item.lowest_recorded_price || item.highest_recorded_price,
        website: item.offers && item.offers.length > 0 ? item.offers[0].link : undefined,
        specifications: item.specs || undefined,
      }
    }

    return null
  } catch (error) {
    console.error("[Product Lookup] Error searching product:", error)
    return null
  }
}

/**
 * Extract product information from a URL (for websites like Amazon, etc.)
 * This is a placeholder - can be extended with web scraping or specific APIs
 * @param url - Product URL
 * @returns Product information or null
 */
export async function lookupProductByUrl(url: string): Promise<ProductLookupResult | null> {
  try {
    // Try to extract product name from URL
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    // Extract potential product identifiers from URL path
    const pathParts = urlObj.pathname.split("/").filter(Boolean)
    const lastPart = pathParts[pathParts.length - 1]
    
    // For Amazon-style URLs, try to extract ASIN or product name
    if (hostname.includes("amazon")) {
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/gp\/product\/([A-Z0-9]{10})/i)
      if (asinMatch && asinMatch[1]) {
        // Could use Amazon Product API here if available
        return {
          name: lastPart.replace(/-/g, " "),
          website: url,
        }
      }
    }
    
    // Generic fallback - extract name from URL
    return {
      name: lastPart.replace(/-/g, " ").replace(/\.html?$/i, ""),
      website: url,
    }
  } catch (error) {
    console.error("[Product Lookup] Error parsing URL:", error)
    return null
  }
}

