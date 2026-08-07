import type { OrderStatus } from "@prisma/client"

import { ORDER_STATUS } from "@/components/ui/status-badge"

/**
 * รูปร่างเดิมที่หน้าเก่าๆ ยังเรียกใช้อยู่ แต่ค่าจริงมาจาก ORDER_STATUS ที่เดียว
 *
 * เดิมมี STATUS_CONFIG สี่ชุดกระจายอยู่คนละไฟล์ คนละรูปร่าง (บางชุดมี borderColor
 * บางชุดมี darkColor บางชุดมี bgColor) แก้ข้อความที่หนึ่งแล้วอีกสามที่ไม่ตาม
 */
export const STATUS_CONFIG = Object.fromEntries(
  Object.entries(ORDER_STATUS).map(([status, meta]) => [
    status,
    {
      label: meta.label,
      icon: meta.icon,
      description: meta.description,
      color: meta.className,
      // แยกไว้เพื่อความเข้ากันได้กับโค้ดเดิม — เส้นขอบรวมอยู่ใน className แล้ว
      borderColor: "",
    },
  ])
) as Record<
  OrderStatus,
  {
    label: string
    icon: (typeof ORDER_STATUS)[OrderStatus]["icon"]
    description?: string
    color: string
    borderColor: string
  }
>

export type OrderStatusKey = OrderStatus

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as OrderStatus] ?? STATUS_CONFIG.PENDING
}
