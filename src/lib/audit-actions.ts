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
}

/** ประเภทข้อมูลที่ถูกบันทึก ใช้ทำตัวกรองในหน้า audit log */
export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  Order: "คำสั่งจอง",
  Product: "สินค้า",
  Category: "หมวดหมู่",
  Quotation: "ใบเสนอราคา",
  User: "สมาชิก",
  Settings: "การตั้งค่า",
}
