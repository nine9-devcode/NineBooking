import { QuotationStatus } from "@prisma/client"

import { AUDIT_ACTIONS, recordAudit } from "@/lib/audit"
import { prisma } from "@/lib/db"

/**
 * ลูกค้าตอบรับหรือปฏิเสธใบเสนอราคา
 *
 * ระบบทำเวอร์ชันใบเสนอราคาไว้ดีมาก (baseNumber / version / isLatest)
 * แต่ปลายทางกลับตัน — ACCEPTED และ REJECTED ตั้งได้เฉพาะแอดมินผ่าน
 * /api/admin/quotations/[id]/status ลูกค้าจึงไม่มีทางกดยอมรับใบของตัวเองได้
 * ทั้งที่นั่นคือจุดประสงค์ทั้งหมดของการออกใบเสนอราคา
 */

export type RespondAction = "accept" | "reject"

export type RespondResult =
  { ok: true; status: QuotationStatus } | { ok: false; reason: RespondFailure }

export type RespondFailure =
  "not_found" | "forbidden" | "not_sent" | "superseded" | "expired" | "already_responded"

export const RESPOND_MESSAGES: Record<RespondFailure, string> = {
  not_found: "ไม่พบใบเสนอราคา",
  forbidden: "ใบเสนอราคานี้ไม่ใช่ของคุณ",
  not_sent: "ใบเสนอราคานี้ยังไม่ได้ส่งให้ลูกค้า",
  superseded: "มีใบเสนอราคาฉบับใหม่กว่าแล้ว กรุณาดูฉบับล่าสุด",
  expired: "ใบเสนอราคาหมดอายุแล้ว กรุณาติดต่อเจ้าหน้าที่เพื่อขอใบใหม่",
  already_responded: "คุณตอบใบเสนอราคานี้ไปแล้ว",
}

export async function respondToQuotation(params: {
  quotationId: string
  userId: string
  action: RespondAction
  note?: string
  ip?: string | null
}): Promise<RespondResult> {
  const { quotationId, userId, action, note, ip } = params

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: {
      id: true,
      status: true,
      isLatest: true,
      validUntil: true,
      respondedAt: true,
      order: { select: { userId: true } },
    },
  })

  if (!quotation) return { ok: false, reason: "not_found" }
  if (quotation.order.userId !== userId) return { ok: false, reason: "forbidden" }

  if (quotation.respondedAt) return { ok: false, reason: "already_responded" }
  // ต้องเป็นฉบับล่าสุด ไม่งั้นลูกค้าอาจกดยอมรับราคาเก่าที่ถูกแก้ไปแล้ว
  if (!quotation.isLatest) return { ok: false, reason: "superseded" }
  if (quotation.status !== "SENT") return { ok: false, reason: "not_sent" }
  if (quotation.validUntil < new Date()) return { ok: false, reason: "expired" }

  const status: QuotationStatus = action === "accept" ? "ACCEPTED" : "REJECTED"

  await prisma.$transaction(async (tx) => {
    await tx.quotation.update({
      where: { id: quotationId },
      data: { status, respondedAt: new Date(), respondedNote: note ?? null },
    })

    await recordAudit(tx, {
      actorId: userId,
      action: AUDIT_ACTIONS.QUOTATION_RESPONDED,
      entityType: "Quotation",
      entityId: quotationId,
      before: { status: quotation.status },
      after: { status, ...(note && { note }) },
      ip,
    })
  })

  return { ok: true, status }
}

/**
 * ปิดใบเสนอราคาที่เลยวันหมดอายุ — เรียกจาก /api/cron
 *
 * schema มี QuotationStatus.EXPIRED และ Quotation.validUntil มาตั้งแต่แรก
 * แต่ไม่มีอะไรเปลี่ยนสถานะให้เลย ใบที่ส่งไปแล้วจึงค้างอยู่ที่ SENT ตลอดไป
 */
export async function expireQuotations(): Promise<number> {
  const { count } = await prisma.quotation.updateMany({
    where: {
      status: "SENT",
      validUntil: { lt: new Date() },
      respondedAt: null,
    },
    data: { status: "EXPIRED" },
  })

  return count
}
