import { AlertCircle, CheckCircle2, Clock, XCircle, type LucideIcon } from "lucide-react"
import type { IssueCategory, IssueStatus, OrderStatus, QuotationStatus } from "@prisma/client"

import { cn } from "@/lib/utils"

/**
 * ป้ายสถานะทั้งระบบ
 *
 * ก่อนหน้านี้ตารางคำสั่งจองมี STATUS_CONFIG สี่ชุดคนละรูปร่าง (บางชุดมี borderColor
 * บางชุดมี darkColor) และสถานะเรื่องแจ้งปัญหามีสามชุด — ที่แย่กว่านั้นคือ
 * ข้อความไม่ตรงกัน CLOSED เป็น "เสร็จสิ้น" สองที่ และ "ปิดเรื่องแล้ว" อีกที่หนึ่ง
 * ผู้ใช้เห็นความไม่ตรงกันนี้จริงเวลาเปลี่ยนหน้า
 *
 * หมายเหตุเรื่องสี: ใช้พื้นจางระดับ 10 เปอร์เซ็นต์ คู่กับตัวอักษรสีเดียวกัน
 * ห้ามใช้โทเคน -foreground ตรงนี้ เพราะตัวนั้นมีไว้สำหรับพื้นทึบเท่านั้น
 */

export interface StatusMeta {
  label: string
  icon: LucideIcon
  className: string
  /** คำอธิบายเพิ่มสำหรับหน้ารายละเอียด */
  description?: string
}

const TONE = {
  pending: "bg-warning/10 text-warning border-warning/25",
  progress: "bg-info/10 text-info border-info/25",
  done: "bg-success/10 text-success border-success/25",
  failed: "bg-destructive/10 text-destructive border-destructive/25",
  neutral: "bg-muted text-muted-foreground border-border",
  accent: "bg-chart-4/10 text-chart-4 border-chart-4/25",
} as const

export const ORDER_STATUS: Record<OrderStatus, StatusMeta> = {
  PENDING: {
    label: "รอดำเนินการ",
    icon: Clock,
    className: TONE.pending,
    description: "ทางร้านกำลังตรวจสอบรายการจอง",
  },
  CONFIRMED: {
    label: "ยืนยันแล้ว",
    icon: CheckCircle2,
    className: TONE.progress,
    description: "ทางร้านยืนยันการจองเรียบร้อยแล้ว",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    icon: CheckCircle2,
    className: TONE.done,
    description: "การจองดำเนินการเสร็จสิ้นแล้ว",
  },
  CANCELLED: {
    label: "ยกเลิก",
    icon: XCircle,
    className: TONE.failed,
    description: "รายการจองนี้ถูกยกเลิกแล้ว",
  },
}

export const ISSUE_STATUS: Record<IssueStatus, StatusMeta> = {
  PENDING: { label: "รอดำเนินการ", icon: AlertCircle, className: TONE.pending },
  IN_PROGRESS: { label: "กำลังดำเนินการ", icon: Clock, className: TONE.progress },
  CLOSED: { label: "เสร็จสิ้น", icon: CheckCircle2, className: TONE.done },
}

export const ISSUE_CATEGORY: Record<IssueCategory, { label: string; className: string }> = {
  BOOKING: { label: "การจอง", className: TONE.accent },
  PAYMENT: { label: "การชำระเงิน", className: TONE.progress },
  USAGE_ISSUE: { label: "ปัญหาการใช้งาน", className: TONE.failed },
  ACCOUNT: { label: "บัญชีผู้ใช้", className: TONE.progress },
  OTHER: { label: "อื่นๆ", className: TONE.neutral },
}

export const QUOTATION_STATUS: Record<QuotationStatus, StatusMeta> = {
  DRAFT: { label: "ฉบับร่าง", icon: Clock, className: TONE.neutral },
  SENT: { label: "ส่งให้ลูกค้าแล้ว", icon: Clock, className: TONE.progress },
  ACCEPTED: { label: "ลูกค้ายอมรับ", icon: CheckCircle2, className: TONE.done },
  REJECTED: { label: "ลูกค้าปฏิเสธ", icon: XCircle, className: TONE.failed },
  EXPIRED: { label: "หมดอายุ", icon: AlertCircle, className: TONE.pending },
}

function Badge({
  meta,
  showIcon,
  className,
}: {
  meta: StatusMeta
  showIcon: boolean
  className?: string
}) {
  const Icon = meta.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        meta.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {meta.label}
    </span>
  )
}

export function OrderStatusBadge({
  status,
  showIcon = true,
  className,
}: {
  status: OrderStatus
  showIcon?: boolean
  className?: string
}) {
  return <Badge meta={ORDER_STATUS[status]} showIcon={showIcon} className={className} />
}

export function IssueStatusBadge({
  status,
  showIcon = true,
  className,
}: {
  status: IssueStatus
  showIcon?: boolean
  className?: string
}) {
  return <Badge meta={ISSUE_STATUS[status]} showIcon={showIcon} className={className} />
}

export function QuotationStatusBadge({
  status,
  showIcon = true,
  className,
}: {
  status: QuotationStatus
  showIcon?: boolean
  className?: string
}) {
  return <Badge meta={QUOTATION_STATUS[status]} showIcon={showIcon} className={className} />
}

export function IssueCategoryBadge({
  category,
  className,
}: {
  category: IssueCategory
  className?: string
}) {
  const meta = ISSUE_CATEGORY[category]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        meta.className,
        className
      )}
    >
      {meta.label}
    </span>
  )
}
