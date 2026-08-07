import { Clock, CheckCircle2, XCircle, LucideIcon } from "lucide-react"
import { ORDER_STATUS } from "@/components/ui/status-badge"

// ===== Types =====
export interface OrderDetail {
  id: string
  orderNumber: string
  status: string
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
    phone: string | null
    image: string | null
    residenceType: string | null  
    memberSince: string
    memberType?: string | null
    memberTypeNote?: string | null
  }
  customerNote: string | null
  adminNote: string | null
  // grouped items
  items: GroupedOrderItem[]
  totalItems: number
  totalQuantity: number
  mainQuantity: number
  pairedQuantity: number
  cancelledBy?: string | null
  createdAt: string
  updatedAt: string
}

// Type สำหรับ grouped items
export interface GroupedOrderItem {
  groupId: string
  productId: string
  product: {
    id: string
    name: string
    image: string | null
    slug: string | null
    isActive: boolean
    category: string | null
  }
  mainQuantity: number
  pairedItems: {
    id: string
    quantity: number
    pairedProduct: {
      id: string
      name: string
      image: string | null
      slug: string | null
      isActive: boolean
    }
  }[]
}

// Legacy type (สำหรับ backward compatibility)
export interface OrderItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    image: string | null
    slug: string | null
    isActive: boolean
    category: string | null
  }
  pairedProduct: {
    id: string
    name: string
    image: string | null
    slug: string | null
    isActive: boolean
  } | null
}

export interface StatusConfig {
  label: string
  color: string
  darkColor?: string
  icon: LucideIcon
}

// ===== Constants =====
// ค่าจริงอยู่ที่ components/ui/status-badge.tsx ที่เดียว ที่นี่แค่แปลงรูปร่างให้เข้ากับโค้ดเดิม
export const STATUS_CONFIG: Record<string, StatusConfig> = Object.fromEntries(
  Object.entries(ORDER_STATUS).map(([status, meta]) => [
    status,
    { label: meta.label, icon: meta.icon, color: meta.className, darkColor: meta.className },
  ])
)

export const STATUS_OPTIONS = Object.entries(ORDER_STATUS).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

// ===== Helpers =====
export function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
}

export function formatAddress(shipping: OrderDetail["shipping"]): string {
  return [
    shipping.address,
    shipping.subDistrict,
    shipping.district,
    shipping.province,
    shipping.postalCode,
  ]
    .filter(Boolean)
    .join(", ")
}

export function formatDate(date: string, includeTime = true): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }

  if (includeTime) {
    options.hour = "2-digit"
    options.minute = "2-digit"
  }

  return new Date(date).toLocaleDateString("th-TH", options)
}