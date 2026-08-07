import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"

// ค่าคงที่อยู่แยกไฟล์เพราะหน้า /admin/audit-log เป็น client component
// และต้องใช้ป้ายพวกนี้ — ถ้าอยู่ในไฟล์เดียวกัน db กับ env จะถูกลากเข้าเบราว์เซอร์ไปด้วย
export { AUDIT_ACTIONS, AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS } from "@/lib/audit-actions"
export type { AuditAction } from "@/lib/audit-actions"

import type { AuditAction } from "@/lib/audit-actions"

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

export interface AuditEntry {
  actorId: string
  action: AuditAction
  entityType: string
  entityId: string
  /** ชื่อที่คนอ่านออก เช่น "ORD-20260807-001" — ใช้เป็นตัวค้นในหน้า audit log */
  entityLabel?: string | null
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
      entityLabel: entry.entityLabel ?? null,
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
): { before: Prisma.InputJsonValue; after: Prisma.InputJsonValue } | null {
  // InputJsonObject เป็น readonly จึงประกอบค่าใน Record ธรรมดาก่อน
  const changedBefore: Record<string, Prisma.InputJsonValue> = {}
  const changedAfter: Record<string, Prisma.InputJsonValue> = {}

  for (const [key, nextValue] of Object.entries(after)) {
    if (nextValue === undefined) continue
    if (Object.is(before[key], nextValue)) continue

    changedBefore[key] = (before[key] ?? null) as Prisma.InputJsonValue
    changedAfter[key] = nextValue as Prisma.InputJsonValue
  }

  return Object.keys(changedAfter).length > 0
    ? { before: changedBefore, after: changedAfter }
    : null
}

/**
 * ลบบันทึกที่เก่ากว่าที่กำหนด — เรียกจาก /api/cron
 *
 * ตาราง audit โตทางเดียวโดยธรรมชาติ ถ้าไม่มีนโยบายลบ สุดท้ายจะกลายเป็น
 * ตารางที่ใหญ่ที่สุดในระบบทั้งที่แทบไม่มีใครอ่านของเก่ากว่าปีที่แล้ว
 *
 * ถ้าต้องเก็บตามข้อกำหนดทางกฎหมาย ให้ย้ายออกไปเก็บที่อื่นก่อนเรียกฟังก์ชันนี้
 * ค่าเริ่มต้น 365 วันตั้งไว้ตามอายุที่พอใช้ตรวจสอบย้อนหลังได้จริง
 */
export async function cleanupOldAuditLogs(retentionDays = 365): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60_000)

  const { count } = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })

  return count
}
