import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * สถานะกำลังโหลด / ไม่มีข้อมูล
 *
 * เดิมมี spinner สี่แบบ (Loader2, RefreshCw, border-4 ทำมือ, border-2 ทำมือ)
 * และกล่อง "ไม่พบข้อมูล" อีกสิบกว่าก๊อปปี้ที่สีไอคอนไม่ตรงกัน
 * บางที่ใช้ text-foreground เต็มน้ำหนักทั้งที่เป็นไอคอนประดับ
 */

const SIZES = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
} as const

export function Spinner({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <span
      role="status"
      aria-label="กำลังโหลด"
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-border border-t-primary",
        SIZES[size],
        className
      )}
    />
  )
}

export function LoadingState({
  label = "กำลังโหลดข้อมูล...",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16", className)}>
      <Spinner />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}
    >
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          {/* ไอคอนเป็นของประดับ ไม่ต้องอ่านออกเสียง และไม่ควรเด่นเท่าตัวหนังสือ */}
          <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      <h3 className="text-base font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
