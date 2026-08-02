// types/checkout.types.ts
// Re-export types จากไฟล์หลัก

import type { CartItem as OriginalCartItem } from "@/features/cart/cart"
import type { GroupedItem as OriginalGroupedItem, GroupedSummary as OriginalSummary } from "@/features/orders/group-items"

// Re-export
export type CartItem = OriginalCartItem
export type GroupedItem = OriginalGroupedItem
export type CheckoutSummary = OriginalSummary

// Types สำหรับ checkout
export interface CheckoutFormData {
  customerName: string
  customerNickname: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  shippingProvince: string
  shippingDistrict: string
  shippingSubDistrict: string
  shippingPostalCode: string
  shippingResidenceType: string
  customerNote: string
}

export interface OrderSubmitResponse {
  success: boolean
  order: {
    id: string
    orderNumber: string
  }
  error?: string
}