import { cn } from "@/lib/utils"

/**
 * กรอบความกว้างของหน้า
 *
 * ก่อนหน้านี้แต่ละหน้าเลือก max-w เองจนมีหกแบบ (7xl/6xl/5xl/4xl/3xl/prose)
 * และ padding อีกห้าแบบ เปิดสลับหน้ากันแล้วเนื้อหาขยับซ้ายขวาตลอด
 * ที่นี่คือที่เดียวที่ตัดสินเรื่องนี้
 */
const WIDTHS = {
  /** ตารางและ grid สินค้า */
  wide: "max-w-7xl",
  /** หน้าเนื้อหาทั่วไป — ค่าเริ่มต้น */
  default: "max-w-6xl",
  /** ฟอร์มและรายละเอียดที่อ่านเป็นคอลัมน์เดียว */
  narrow: "max-w-3xl",
} as const

export function PageContainer({
  size = "default",
  className,
  children,
}: {
  size?: keyof typeof WIDTHS
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8", WIDTHS[size], className)}>
      {children}
    </div>
  )
}
