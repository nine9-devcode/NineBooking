// components/admin/quotations/quotation-detail/quotation-types.ts
// Types และ helpers สำหรับหน้า Detail

import { QuotationDetail, QuotationItem, QuotationItemFormData } from "../types"

// Re-export types
export type { QuotationDetail, QuotationItem, QuotationItemFormData }

// Grouped item for display
export interface GroupedQuotationItem {
  main: QuotationItemFormData
  paired: QuotationItemFormData[]
}

// Totals
export interface QuotationTotals {
  subtotal: number
  vatAmount: number
  totalAmount: number
}

// Helper: Group items by main/paired
export function groupQuotationItems(items: QuotationItemFormData[]): GroupedQuotationItem[] {
  const groups: GroupedQuotationItem[] = []
  const mainItems = items.filter(i => !i.isPairedProduct)

  mainItems.forEach(mainItem => {
    const pairedItems = items.filter(
      i => i.isPairedProduct && i.pairedWithTempId === mainItem.tempId
    )
    groups.push({ main: mainItem, paired: pairedItems })
  })

  return groups
}

// Helper: Calculate totals
export function calculateTotals(
  items: QuotationItemFormData[],
  includeVat: boolean,
  vatPercent: number
): QuotationTotals {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const vatAmount = includeVat ? subtotal * (vatPercent / 100) : 0
  const totalAmount = subtotal + vatAmount
  return { subtotal, vatAmount, totalAmount }
}

// Helper: Map QuotationItem to FormData
export function mapItemsToFormData(
  items: QuotationItem[]
): QuotationItemFormData[] {
  return items.map((item) => ({
    tempId: item.id,
    productId: item.productId,
    productName: item.productName,
    productImage: item.productImage,
    isPairedProduct: item.isPairedProduct,
    pairedWithTempId: item.pairedWithIndex !== null
      ? items.find((i) => i.sortOrder === item.pairedWithIndex)?.id || null
      : null,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }))
}

// Helper: Format address
export function formatAddress(shipping: QuotationDetail["shipping"]): string {
  const parts: string[] = []

  if (shipping.address) parts.push(shipping.address)
  if (shipping.subDistrict) parts.push(`ต.${shipping.subDistrict}`)
  if (shipping.district) parts.push(`อ.${shipping.district}`)
  if (shipping.province) parts.push(`จ.${shipping.province}`)
  if (shipping.postalCode) parts.push(shipping.postalCode)

  return parts.join(" ")
}