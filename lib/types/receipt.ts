import { Product } from "./product"

export interface ReceiptItem {
  id: string
  productId: string
  product?: Product // Optional populated product
  quantity: number
  discountedPrice: number
  createdAt?: string
  updatedAt?: string
}

export interface Receipt {
  id?: string
  receiptNumber: string
  storeName: string
  /** Optional link to a saved store profile (`null` on PATCH clears the link) */
  storeId?: string | null
  /** Extra merchant details (e.g. from the receipt) */
  storeAddress?: string
  storeWebsite?: string
  receiptDate: string // ISO date string
  items: ReceiptItem[]
  totalAmount: number
  userId: string
  receiptImage?: string // Firebase Storage download URL
  /** Original invoice (PDF) in Firebase Storage */
  receiptFile?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

