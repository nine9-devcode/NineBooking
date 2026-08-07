// ไฟล์: components/orders/types.ts

export interface PairedProduct {
  name: string
  image: string | null
  quantity: number
}

export interface PreviewItem {
  productName: string
  productImage: string | null
  quantity: number
  pairedCount: number
  pairedProducts: PairedProduct[]
}

export interface OrderPreview {
  id: string
  orderNumber: string
  status: string
  itemCount: number
  totalQuantity: number
  mainQuantity: number
  pairedQuantity: number
  createdAt: string
  updatedAt: string
  previewItems: PreviewItem[]
}

export interface OrderNotification {
  id: string
  orderId: string
  orderNumber: string
  oldStatus: string
  newStatus: string
  isRead: boolean
  createdAt: string
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}
