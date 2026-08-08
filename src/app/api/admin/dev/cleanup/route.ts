import { z } from "zod"

import { requireSuperAdmin } from "@/lib/api/guards"
import { apiOk, handleApiError } from "@/lib/api/response"
import { AUDIT_ACTIONS, recordAuditSafely } from "@/lib/audit"
import { prisma } from "@/lib/db"
import { clientIp } from "@/lib/rate-limit"

/**
 * ล้างข้อมูลที่โตเรื่อยๆ ตามการใช้งาน
 *
 * ทุกเป้าหมายในนี้เป็นข้อมูลที่สร้างใหม่ได้หรือไม่มีผลย้อนหลัง —
 * ยอดสรุปการเข้าชม คำสั่งจอง ใบเสนอราคา และประวัติการใช้งาน ไม่ถูกแตะเลย
 *
 * ⚠️ ไม่มีเป้าหมาย "ล้างประวัติการใช้งาน" โดยเจตนา
 * ถ้าแอดมินลบร่องรอยตัวเองได้ในคลิกเดียว บันทึกทั้งหมดก็เชื่อถือไม่ได้
 * การลบของเก่าทำโดยอัตโนมัติผ่าน cleanupOldAuditLogs() ที่เก็บ 365 วัน
 */

const bodySchema = z.object({
  target: z.enum(["productViews", "notifications", "rateLimits"]),
  /** ใช้กับ notifications เท่านั้น */
  olderThanDays: z.number().int().min(0).max(3650).default(30),
})

const TARGET_LABELS: Record<string, string> = {
  productViews: "ยอดเข้าชมดิบ",
  notifications: "แจ้งเตือนที่อ่านแล้ว",
  rateLimits: "ตัวนับจำกัดอัตรา",
}

export async function POST(request: Request) {
  try {
    const guard = await requireSuperAdmin()
    if (!guard.ok) return guard.response

    const { target, olderThanDays } = bodySchema.parse(await request.json())
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60_000)

    let removed = 0

    if (target === "productViews") {
      // ลบเฉพาะแถวดิบ — ยอดสรุปใน ProductViewSummary ที่ใช้ทำกราฟยังอยู่ครบ
      const { count } = await prisma.productView.deleteMany({})
      removed = count
    }

    if (target === "notifications") {
      const results = await prisma.$transaction([
        prisma.orderNotification.deleteMany({
          where: { isRead: true, createdAt: { lt: cutoff } },
        }),
        prisma.issueNotification.deleteMany({
          where: { isRead: true, createdAt: { lt: cutoff } },
        }),
        prisma.userOrderNotification.deleteMany({
          where: { isRead: true, createdAt: { lt: cutoff } },
        }),
        prisma.userSupportNotification.deleteMany({
          where: { isRead: true, createdAt: { lt: cutoff } },
        }),
      ])
      removed = results.reduce((sum, r) => sum + r.count, 0)
    }

    if (target === "rateLimits") {
      // ใช้ปลดล็อกบัญชีที่โดนล็อกจากการกรอกรหัสผิด โดยไม่ต้องรอ 15 นาที
      const { count } = await prisma.rateLimit.deleteMany({})
      removed = count
    }

    await recordAuditSafely({
      actorId: guard.user.id,
      action: AUDIT_ACTIONS.SYSTEM_DATA_CLEARED,
      entityType: "System",
      entityId: target,
      entityLabel: TARGET_LABELS[target],
      after: { target, removed, ...(target === "notifications" && { olderThanDays }) },
      ip: clientIp(request.headers),
    })

    return apiOk({ target, removed })
  } catch (error) {
    return handleApiError(error, "admin/dev/cleanup")
  }
}
