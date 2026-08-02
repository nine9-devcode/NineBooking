// ไฟล์: components/orders/constants.ts

import { Clock, CheckCircle2, XCircle } from "lucide-react"

export const STATUS_CONFIG = {
  PENDING: {
    label: "รอดำเนินการ",
    color: "bg-warning/10 text-warning",
    borderColor: "border-warning/40",
    icon: Clock,
    description: "ทางร้านกำลังตรวจสอบรายการจอง",
  },
  CONFIRMED: {
    label: "ยืนยันแล้ว",
    color: "bg-info/10 text-info",
    borderColor: "border-info/40",
    icon: CheckCircle2,
    description: "ทางร้านยืนยันการจองเรียบร้อยแล้ว",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    color: "bg-success/10 text-success",
    borderColor: "border-success/40",
    icon: CheckCircle2,
    description: "การจองดำเนินการเสร็จสิ้นแล้ว",
  },
  CANCELLED: {
    label: "ยกเลิก",
    color: "bg-destructive/10 text-destructive",
    borderColor: "border-destructive/40",
    icon: XCircle,
    description: "การจองถูกยกเลิก",
  },
} as const

export type OrderStatusKey = keyof typeof STATUS_CONFIG

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as OrderStatusKey] || STATUS_CONFIG.PENDING
}