import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"

/**
 * บันทึกว่าใครทำอะไรกับข้อมูลไหน
 *
 * ระบบที่แตะเรื่องเงินและคำสั่งซื้อควรตอบได้เสมอว่า "ใครเปลี่ยนอันนี้"
 * ก่อนหน้านี้ตอบไม่ได้เลย — ไม่รู้ว่าใครยกเลิกคำสั่งจอง ใครลบสินค้า
 * หรือใครตั้งใครเป็นแอดมิน
 *
 * เรียกด้วย tx ตัวเดียวกับที่แก้ข้อมูลเสมอ เพื่อให้บันทึกกับการเปลี่ยนแปลง
 * commit พร้อมกัน — ถ้าการแก้ rollback บันทึกก็หายไปด้วย ไม่เหลือร่องรอยเท็จ
 */

/** ชื่อ action ทั้งหมดที่ระบบใช้ รวมไว้ที่เดียวเพื่อไม่ให้พิมพ์ผิดกันคนละแบบ */
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

export interface AuditEntry {
  actorId: string
  action: AuditAction
  entityType: string
  entityId: string
  /** ค่าก่อนแก้ — ใส่เฉพาะฟิลด์ที่เปลี่ยน ไม่ต้องยัดทั้งแถว */
  before?: Prisma.InputJsonValue
  after?: Prisma.InputJsonValue
  ip?: string | null
}

/** เขียนบันทึกในทรานแซกชันเดียวกับการเปลี่ยนข้อมูล */
export async function recordAudit(
  tx: Prisma.TransactionClient,
  entry: AuditEntry
): Promise<void> {
  await tx.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: entry.before,
      after: entry.after,
      ip: entry.ip ?? null,
    },
  })
}

/**
 * เขียนบันทึกนอกทรานแซกชัน — ใช้เมื่อการเปลี่ยนแปลงเสร็จไปแล้ว
 * และการบันทึกล้มเหลวไม่ควรทำให้คำสั่งของผู้ใช้พังตาม
 */
export async function recordAuditSafely(entry: AuditEntry): Promise<void> {
  try {
    await recordAudit(prisma, entry)
  } catch (error) {
    console.error("[audit] บันทึกไม่สำเร็จ:", error)
  }
}

/** เอาเฉพาะฟิลด์ที่ค่าเปลี่ยนจริง เพื่อไม่ให้บันทึกบวมด้วยค่าที่เหมือนเดิม */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>
): { before: Record<string, unknown>; after: Record<string, unknown> } | null {
  const changedBefore: Record<string, unknown> = {}
  const changedAfter: Record<string, unknown> = {}

  for (const [key, nextValue] of Object.entries(after)) {
    if (nextValue === undefined) continue
    if (Object.is(before[key], nextValue)) continue

    changedBefore[key] = before[key] ?? null
    changedAfter[key] = nextValue
  }

  return Object.keys(changedAfter).length > 0
    ? { before: changedBefore, after: changedAfter }
    : null
}
