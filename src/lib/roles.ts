import type { UserRole } from "@prisma/client"

/**
 * ตัวช่วยเทียบสิทธิ์ — ห้าม import อะไรจากฝั่งเซิร์ฟเวอร์ในไฟล์นี้
 *
 * client component หลายตัวต้องใช้ (ตารางสมาชิก, หน้าปิดปรับปรุง, sidebar)
 * ถ้าไปเรียกจากไฟล์ที่แตะ lib/db จะลาก Prisma เข้าบันเดิลเบราว์เซอร์แล้วพัง
 * แบบเดียวกับที่เคยเกิดกับ lib/audit — ดูคำอธิบายใน src/lib/audit-actions.ts
 *
 * ⚠️ ห้ามเขียน `role === "admin"` ตรงๆ ที่ไหนอีก
 * ตอนเพิ่ม superadmin เข้ามา มี 17 จุดในโค้ดที่เทียบแบบนั้น ซึ่งจะปฏิเสธ
 * superadmin ทั้งหมดโดยไม่มีใครรู้ตัว ใช้ isAdminRole() แทนเสมอ
 */

/** เข้าหลังบ้านได้ไหม — superadmin คือ admin ที่มีสิทธิ์มากกว่า ไม่ใช่คนละสายกัน */
export function isAdminRole(role: UserRole | string | null | undefined): boolean {
  return role === "admin" || role === "superadmin"
}

/** ใช้เครื่องมือระบบที่ลบข้อมูลได้ไหม */
export function isSuperAdminRole(role: UserRole | string | null | undefined): boolean {
  return role === "superadmin"
}

export const ROLE_LABELS: Record<string, string> = {
  user: "ผู้ใช้ทั่วไป",
  admin: "ผู้ดูแลระบบ",
  superadmin: "ผู้ดูแลระบบสูงสุด",
}

export function roleLabel(role: UserRole | string | null | undefined): string {
  return ROLE_LABELS[String(role)] ?? String(role ?? "—")
}

/** role ที่แอดมินธรรมดาตั้งให้คนอื่นได้ — ตั้ง superadmin ไม่ได้ ไม่งั้นเลื่อนขั้นตัวเองได้ */
export const ASSIGNABLE_BY_ADMIN = ["user", "admin"] as const
export const ASSIGNABLE_BY_SUPERADMIN = ["user", "admin", "superadmin"] as const
