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
  receiptDate: string // ISO date string
  items: ReceiptItem[]
  totalAmount: number
  userId: string
  receiptImage?: string // URL to uploaded receipt image
  notes?: string
  createdAt?: string
  updatedAt?: string
}

