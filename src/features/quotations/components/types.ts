// components/admin/quotations/types.ts

import { LucideIcon } from "lucide-react"

// ===== Status Types =====
export type QuotationStatus = 
  | "DRAFT" 
  | "SENT" 
  | "ACCEPTED" 
  | "REJECTED" 
  | "EXPIRED"

export interface StatusConfig {
  label: string
  color: string
  darkColor: string
  icon: LucideIcon
}

// ===== Quotation Item Types =====
export interface QuotationItem {
  id: string
  productId: string | null
  productName: string
  productImage: string | null
  isPairedProduct: boolean
  pairedWithIndex: number | null
  quantity: number
  unitPrice: number
  amount: number
  sortOrder: number
}

// ===== Version Summary =====
export interface QuotationVersionSummary {
  id: string
  version: number
  quotationNumber: string
  status: QuotationStatus
  totalAmount: number
  createdAt: string
  isLatest: boolean
}

// ===== Quotation Detail Types =====
export interface QuotationDetail {
  id: string
  quotationNumber: string
  orderId: string
  orderNumber: string
  customer: {
    name: string
    nickname: string | null
    email: string
    phone: string
  }
  shipping: {
    address: string | null
    province: string | null
    district: string | null
    subDistrict: string | null
    postalCode: string | null
    residenceType: string | null
  }
  user: {
    id: string
    name: string | null
    nickname: string | null
    email: string | null
    image: string | null
    memberType: string | null
    memberTypeNote: string | null
    memberSince: string | null
  } | null
  items: QuotationItem[]
  subtotal: number
  includeVat: boolean
  vatPercent: number
  vatAmount: number
  totalAmount: number
  validDays: number
  validUntil: string
  notes: string | null
  pdfNotes: string | null
  status: QuotationStatus
  createdBy: string | null
  createdByName: string | null
  createdAt: string
  updatedAt: string
  version: number
  baseNumber: string
  isLatest: boolean
  versions?: QuotationVersionSummary[]
}

// ===== List/Preview Types =====
export interface QuotationPreview {
  id: string
  quotationNumber: string
  orderId: string
  orderNumber: string
  customer: {
    id: string | null
    name: string
    nickname: string | null
    email: string
    phone: string
    image: string | null
    memberType: string | null
    memberTypeNote: string | null
    userDeleted?: boolean
  }
  itemCount: number
  subtotal: number
  includeVat: boolean
  vatAmount: number
  totalAmount: number
  status: QuotationStatus
  validUntil: string
  createdAt: string
  createdByName: string | null
  version: number
  baseNumber: string
}

export interface QuotationStats {
  total: number
  DRAFT: number
  SENT: number
  ACCEPTED: number
  REJECTED: number
  EXPIRED: number
}

// ===== Form Types =====
export interface QuotationItemFormData {
  tempId: string
  productId: string | null
  productName: string
  productImage: string | null
  isPairedProduct: boolean
  pairedWithTempId: string | null
  quantity: number
  unitPrice: number
}

export interface QuotationFormData {
  orderId: string
  items: QuotationItemFormData[]
  includeVat: boolean
  vatPercent: number
  validDays: number
  notes: string
}

// ===== Props Types =====
export interface QuotationModalProps {
  orderId: string
  orderNumber: string
  orderItems: OrderItemForQuotation[]
  customer: {
    name: string
    nickname: string | null
    email: string
    phone: string
  }
  isOpen: boolean
  onClose: () => void
  onSuccess?: (quotationId: string) => void
}

export interface OrderItemForQuotation {
  groupId: string
  productId: string
  product: {
    id: string
    name: string
    image: string | null
  }
  mainQuantity: number
  pairedItems: {
    id: string
    quantity: number
    pairedProduct: {
      id: string
      name: string
      image: string | null
    }
  }[]
}