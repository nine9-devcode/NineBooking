import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * ดึงข้อความจากสิ่งที่ถูก throw ออกมา
 * ใน TypeScript ตัวแปรใน catch เป็น unknown เพราะ throw อะไรก็ได้ ไม่ใช่แค่ Error
 */
export function getErrorMessage(
  error: unknown,
  fallback = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
): string {
  if (error instanceof Error) return error.message || fallback
  if (typeof error === "string" && error) return error
  return fallback
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(amount)
}
