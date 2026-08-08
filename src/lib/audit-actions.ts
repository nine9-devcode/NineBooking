/**
 * ชื่อ action และป้ายภาษาไทยของ audit log
 *
 * แยกออกมาจาก lib/audit.ts เพราะไฟล์นั้น import lib/db (แล้ว db ก็ import lib/env
 * ที่ตรวจ environment ตอนโหลดโมดูล) หน้า /admin/audit-log เป็น client component
 * พอ import ป้ายจากที่นั่นตรงๆ ทั้งสายเลยถูกลากเข้าไปในบันเดิลฝั่งเบราว์เซอร์
 * แล้วพังทันทีเพราะ process.env ในเบราว์เซอร์ไม่มี DATABASE_URL
 *
 * ไฟล์นี้เป็นค่าคงที่ล้วน ไม่ import อะไรเลย จึงใช้ได้ทั้งสองฝั่ง
 */

export const AUDIT_ACTIONS = {
  ORDER_STATUS_CHANGED: "order.status_changed",
  ORDER_CANCELLED: "order.cancelled",
  ORDER_NOTE_UPDATED: "order.note_updated",

  PRODUCT_CREATED: "product.created",
  PRODUCT_UPDATED: "product.updated",
  PRODUCT_DELETED: "product.deleted",

  CATEGORY_CREATED: "category.created",
  CATEGORY_UPDATED: "category.updated",
  CATEGORY_DELETED: "category.deleted",

  QUOTATION_CREATED: "quotation.created",
  QUOTATION_UPDATED: "quotation.updated",
  QUOTATION_SENT: "quotation.sent",
  QUOTATION_STATUS_CHANGED: "quotation.status_changed",
  QUOTATION_RESPONDED: "quotation.responded",

  USER_ROLE_CHANGED: "user.role_changed",
  USER_DELETED: "user.deleted",
  ADMIN_CREATED: "user.admin_created",

  SETTINGS_UPDATED: "settings.updated",

  // เครื่องมือระบบ — ลบข้อมูลได้ แต่ลบแบบไม่มีร่องรอยไม่ได้
  SYSTEM_JOB_RUN: "system.job_run",
  SYSTEM_DATA_CLEARED: "system.data_cleared",
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

/** ป้ายภาษาไทยสำหรับแสดงในหน้า /admin/audit-log */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  [AUDIT_ACTIONS.ORDER_STATUS_CHANGED]: "เปลี่ยนสถานะคำสั่งจอง",
  [AUDIT_ACTIONS.ORDER_CANCELLED]: "ยกเลิกคำสั่งจอง",
  [AUDIT_ACTIONS.ORDER_NOTE_UPDATED]: "แก้หมายเหตุคำสั่งจอง",
  [AUDIT_ACTIONS.PRODUCT_CREATED]: "เพิ่มสินค้า",
  [AUDIT_ACTIONS.PRODUCT_UPDATED]: "แก้ไขสินค้า",
  [AUDIT_ACTIONS.PRODUCT_DELETED]: "ลบสินค้า",
  [AUDIT_ACTIONS.CATEGORY_CREATED]: "เพิ่มหมวดหมู่",
  [AUDIT_ACTIONS.CATEGORY_UPDATED]: "แก้ไขหมวดหมู่",
  [AUDIT_ACTIONS.CATEGORY_DELETED]: "ลบหมวดหมู่",
  [AUDIT_ACTIONS.QUOTATION_CREATED]: "ออกใบเสนอราคา",
  [AUDIT_ACTIONS.QUOTATION_UPDATED]: "แก้ไขใบเสนอราคา",
  [AUDIT_ACTIONS.QUOTATION_SENT]: "ส่งใบเสนอราคาให้ลูกค้า",
  [AUDIT_ACTIONS.QUOTATION_STATUS_CHANGED]: "เปลี่ยนสถานะใบเสนอราคา",
  [AUDIT_ACTIONS.QUOTATION_RESPONDED]: "ลูกค้าตอบใบเสนอราคา",
  [AUDIT_ACTIONS.USER_ROLE_CHANGED]: "เปลี่ยนบทบาทสมาชิก",
  [AUDIT_ACTIONS.USER_DELETED]: "ลบสมาชิก",
  [AUDIT_ACTIONS.ADMIN_CREATED]: "สร้างบัญชีผู้ดูแลระบบ",
  [AUDIT_ACTIONS.SETTINGS_UPDATED]: "แก้ไขการตั้งค่าระบบ",
  [AUDIT_ACTIONS.SYSTEM_JOB_RUN]: "สั่งรันงานตามเวลา",
  [AUDIT_ACTIONS.SYSTEM_DATA_CLEARED]: "ล้างข้อมูลระบบ",
}

/** ประเภทข้อมูลที่ถูกบันทึก ใช้ทำตัวกรองในหน้า audit log */
export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  Order: "คำสั่งจอง",
  Product: "สินค้า",
  Category: "หมวดหมู่",
  Quotation: "ใบเสนอราคา",
  User: "สมาชิก",
  Settings: "การตั้งค่า",
  System: "ระบบ",
}

/**
 * ป้ายภาษาไทยของฟิลด์ที่ถูกบันทึกใน before/after
 *
 * ของเดิมหน้า audit log โชว์ชื่อฟิลด์ดิบ เช่น "status: PENDING → CONFIRMED"
 * ซึ่งอ่านรู้เรื่องเฉพาะคนที่รู้จัก schema
 */
export const AUDIT_FIELD_LABELS: Record<string, string> = {
  status: "สถานะ",
  role: "บทบาท",
  name: "ชื่อ",
  nickname: "ชื่อเล่น",
  phone: "เบอร์โทร",
  email: "อีเมล",
  price: "ราคา",
  unitPrice: "ราคาต่อหน่วย",
  totalAmount: "ยอดรวม",
  quantity: "จำนวน",
  isActive: "เปิดใช้งาน",
  cancelReason: "เหตุผลที่ยกเลิก",
  note: "หมายเหตุ",
  adminNote: "หมายเหตุของแอดมิน",
  showHomePage: "เปิดหน้าเว็บ",
  categoryId: "หมวดหมู่",
  slug: "slug",
  validUntil: "ยืนราคาถึง",
  job: "งาน",
  target: "เป้าหมาย",
  removed: "จำนวนที่ลบ",
  durationMs: "เวลาที่ใช้ (มิลลิวินาที)",
}

/** ค่าที่เป็น enum ก็ต้องแปลด้วย ไม่งั้นได้ "สถานะ: PENDING → CONFIRMED" ซึ่งแปลครึ่งเดียว */
export const AUDIT_VALUE_LABELS: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  CONFIRMED: "ยืนยันแล้ว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  DRAFT: "ฉบับร่าง",
  SENT: "ส่งให้ลูกค้าแล้ว",
  ACCEPTED: "ลูกค้ายอมรับ",
  REJECTED: "ลูกค้าปฏิเสธ",
  EXPIRED: "หมดอายุ",
  IN_PROGRESS: "กำลังดำเนินการ",
  CLOSED: "เสร็จสิ้น",
  admin: "ผู้ดูแลระบบ",
  user: "ผู้ใช้ทั่วไป",
  CUSTOMER: "ลูกค้า",
  ADMIN: "แอดมิน",
  true: "ใช่",
  false: "ไม่",
}

export function auditFieldLabel(field: string): string {
  return AUDIT_FIELD_LABELS[field] ?? field
}

export function auditValueLabel(value: unknown): string {
  if (value === null || value === undefined) return "—"
  return AUDIT_VALUE_LABELS[String(value)] ?? String(value)
}
