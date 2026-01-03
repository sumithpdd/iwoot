import { createProduct, updateProduct } from "./products"
import { createReceipt } from "./receipts"
import { Product, WantProduct, HaveProduct } from "@/lib/types/product"
import { Receipt, ReceiptItem } from "@/lib/types/receipt"

/**
 * Seed the database with dummy products
 * Call this function once to populate initial data
 */
export async function seedProducts(userId: string): Promise<void> {
  const dummyProducts: Array<Omit<WantProduct, "id" | "createdAt" | "updatedAt"> | Omit<HaveProduct, "id" | "createdAt" | "updatedAt">> = [
    // iPad Pro - Want
    {
      type: "want",
      name: "Apple iPad Pro 13-inch M5 WiFi",
      brand: "Apple",
      website: "https://www.joybuy.co.uk/dp/apple-ipad-pro-13-m5-wifi/10451022",
      originalPrice: 1299.99,
      currentPrice: 1249.99,
      date: new Date().toISOString().split("T")[0],
      userId,
      description: "The most powerful iPad ever with the M5 chip, featuring a stunning 13-inch Liquid Retina XDR display, advanced camera system, and all-day battery life.",
      category: "Electronics",
      model: "iPad Pro 13-inch",
      sku: "10451022",
      color: "Space Gray",
      specifications: {
        "Display": "13-inch Liquid Retina XDR",
        "Chip": "Apple M5",
        "Storage": "256GB",
        "Connectivity": "Wi-Fi",
        "Camera": "12MP Wide, 10MP Ultra Wide",
        "Battery": "Up to 10 hours",
        "Weight": "682g"
      },
      images: [
        "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-finish-select-202404-13inch-space-gray-wifi_FMT_WHH?wid=940&hei=1112&fmt=png-alpha&.v=1712686106802"
      ],
      targetPrice: 1100.00,
      notes: "Looking for a good deal on this iPad Pro"
    },
    // iPad Pro 11-inch - Have
    {
      type: "have",
      name: "Apple iPad Pro 11-inch M5 WiFi",
      brand: "Apple",
      website: "https://www.joybuy.co.uk/dp/apple-ipad-pro-11-m5-wifi/10451000",
      originalPrice: 999.99,
      priceBought: 899.99,
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days ago
      userId,
      description: "Compact yet powerful iPad Pro with M5 chip, perfect for on-the-go productivity and creativity.",
      category: "Electronics",
      model: "iPad Pro 11-inch",
      sku: "10451000",
      color: "Silver",
      specifications: {
        "Display": "11-inch Liquid Retina",
        "Chip": "Apple M5",
        "Storage": "128GB",
        "Connectivity": "Wi-Fi",
        "Camera": "12MP Wide, 10MP Ultra Wide",
        "Battery": "Up to 10 hours",
        "Weight": "466g"
      },
      images: [
        "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-finish-select-202404-11inch-silver-wifi_FMT_WHH?wid=940&hei=1112&fmt=png-alpha&.v=1712686106802"
      ],
      purchaseLocation: "Joybuy UK",
      warrantyExpiry: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 1 year from purchase
      notes: "Great purchase, very happy with the performance"
    },
    // Beosound A5 - Want
    {
      type: "want",
      name: "Bang & Olufsen Beosound A5",
      brand: "Bang & Olufsen",
      website: "https://www.bang-olufsen.com/en/gb/speakers/beosound-a5",
      originalPrice: 1400.00,
      currentPrice: 1200.00,
      date: new Date().toISOString().split("T")[0],
      userId,
      description: "Powerful portable speaker with immense sound. Wi-Fi and Bluetooth speaker with long-lasting battery and wireless charging built in.",
      category: "Audio",
      model: "Beosound A5",
      color: "Nordic Weave",
      specifications: {
        "Type": "Portable Wi-Fi & Bluetooth Speaker",
        "Battery": "Long-lasting with wireless charging",
        "Connectivity": "Wi-Fi, Bluetooth",
        "Sound": "360-degree immersive audio",
        "Materials": "Premium Nordic Weave, Oak, Dark Oak options",
        "Weight": "Approx 3.5kg"
      },
      images: [
        "https://www.bang-olufsen.com/dw/image/v2/BFWN_PRD/on/demandware.static/-/Sites-master-catalog/default/dw12345678/images/high-res/beosound-a5-nordic-weave.png"
      ],
      targetPrice: 1000.00,
      notes: "Beautiful design, waiting for a sale"
    },
    // iPhone 15 Pro - Have
    {
      type: "have",
      name: "iPhone 15 Pro",
      brand: "Apple",
      website: "https://www.apple.com/iphone-15-pro/",
      originalPrice: 999.99,
      priceBought: 949.99,
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 60 days ago
      userId,
      description: "Titanium design. A17 Pro chip. Action button. Pro camera system.",
      category: "Electronics",
      model: "iPhone 15 Pro",
      sku: "IPHONE15PRO256",
      color: "Natural Titanium",
      size: "256GB",
      specifications: {
        "Display": "6.1-inch Super Retina XDR",
        "Chip": "A17 Pro",
        "Storage": "256GB",
        "Camera": "48MP Main, 12MP Ultra Wide, 12MP Telephoto",
        "Battery": "Up to 23 hours video playback",
        "Weight": "187g"
      },
      images: [
        "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-natural-titanium?wid=940&hei=1112&fmt=png-alpha&.v=1693009279096"
      ],
      purchaseLocation: "Apple Store",
      warrantyExpiry: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 1 year from purchase
      notes: "Excellent phone, love the titanium finish"
    },
    // MacBook Pro M3 - Want
    {
      type: "want",
      name: "MacBook Pro 14-inch M3",
      brand: "Apple",
      website: "https://www.apple.com/macbook-pro-14/",
      originalPrice: 1999.99,
      currentPrice: 1899.99,
      date: new Date().toISOString().split("T")[0],
      userId,
      description: "Supercharged by M3 chip. Up to 22 hours of battery life. Stunning Liquid Retina XDR display.",
      category: "Electronics",
      model: "MacBook Pro 14-inch",
      sku: "MBP14M3",
      color: "Space Gray",
      size: "512GB SSD, 18GB Unified Memory",
      specifications: {
        "Display": "14.2-inch Liquid Retina XDR",
        "Chip": "Apple M3",
        "Memory": "18GB Unified Memory",
        "Storage": "512GB SSD",
        "Battery": "Up to 22 hours",
        "Weight": "1.6kg",
        "Ports": "3x Thunderbolt 4, HDMI, SDXC, MagSafe 3"
      },
      images: [
        "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=940&hei=1112&fmt=png-alpha&.v=1697230830209"
      ],
      targetPrice: 1700.00,
      notes: "Need for work, waiting for better price"
    },
    // Nike Air Max - Have
    {
      type: "have",
      name: "Nike Air Max 90",
      brand: "Nike",
      website: "https://www.nike.com/air-max-90",
      originalPrice: 129.99,
      priceBought: 99.99,
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 90 days ago
      userId,
      description: "Classic running shoes with visible Air cushioning for all-day comfort.",
      category: "Footwear",
      model: "Air Max 90",
      color: "White/Black",
      size: "UK 10",
      specifications: {
        "Type": "Running Shoes",
        "Cushioning": "Air Max",
        "Upper": "Leather and Synthetic",
        "Outsole": "Rubber",
        "Fit": "True to size"
      },
      images: [
        "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/b7d9211c-26e7-4311-ac24-201054b82880/air-max-90-shoes-6n3vKB.png"
      ],
      purchaseLocation: "Nike Store",
      condition: "Good",
      notes: "Very comfortable, great for daily wear"
    }
  ]

  console.log(`Seeding ${dummyProducts.length} products for user ${userId}...`)

  const createdProductIds: string[] = []

  for (const product of dummyProducts) {
    try {
      const productId = await createProduct(product)
      createdProductIds.push(productId)
      console.log(`✓ Created product: ${product.name} (ID: ${productId})`)
    } catch (error) {
      console.error(`✗ Failed to create product: ${product.name}`, error)
    }
  }

  // Create receipts and link to products
  console.log("Creating receipts...")
  
  const now = new Date()
  const receipts: Omit<Receipt, "id" | "createdAt" | "updatedAt">[] = [
    {
      receiptNumber: `RCPT-${now.getFullYear()}-001`,
      storeName: "Apple Store",
      receiptDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days ago
      items: createdProductIds.length > 1 ? [
        {
          id: "1",
          productId: createdProductIds[1], // iPad Pro 11-inch
          quantity: 1,
          discountedPrice: 899.99,
        },
      ] : [],
      totalAmount: 899.99,
      userId,
      notes: "Bought during sale",
    },
    {
      receiptNumber: `RCPT-${now.getFullYear()}-002`,
      storeName: "Apple Store",
      receiptDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 60 days ago
      items: createdProductIds.length > 3 ? [
        {
          id: "2",
          productId: createdProductIds[3], // iPhone 15 Pro
          quantity: 1,
          discountedPrice: 949.99,
        },
      ] : [],
      totalAmount: 949.99,
      userId,
    },
    {
      receiptNumber: `RCPT-${now.getFullYear()}-003`,
      storeName: "Nike Store",
      receiptDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 90 days ago
      items: createdProductIds.length > 5 ? [
        {
          id: "3",
          productId: createdProductIds[5], // Nike Air Max
          quantity: 1,
          discountedPrice: 99.99,
        },
      ] : [],
      totalAmount: 99.99,
      userId,
    },
  ]

  const createdReceiptIds: string[] = []

  for (const receipt of receipts) {
    if (receipt.items.length > 0) {
      try {
        const receiptId = await createReceipt(receipt)
        createdReceiptIds.push(receiptId)
        console.log(`✓ Created receipt: ${receipt.receiptNumber} (ID: ${receiptId})`)
        
        // Link product to receipt
        if (receipt.items[0]?.productId) {
          try {
            await updateProduct(receipt.items[0].productId, {
              receiptId,
            } as any)
            console.log(`✓ Linked product to receipt`)
          } catch (error) {
            console.error("Failed to link product to receipt:", error)
          }
        }
      } catch (error) {
        console.error(`✗ Failed to create receipt: ${receipt.receiptNumber}`, error)
      }
    }
  }

  console.log("Seeding complete!")
}

