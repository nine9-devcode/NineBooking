import { z } from "zod"

import { requireSuperAdmin } from "@/lib/api/guards"
import { apiOk, handleApiError } from "@/lib/api/response"
import { AUDIT_ACTIONS, recordAuditSafely } from "@/lib/audit"
import { clientIp } from "@/lib/rate-limit"
import { runJobs } from "@/app/api/cron/route"
import { archiveProductViews } from "@/features/dashboard/archive-product-views"
import { cleanupExpiredResetTokens } from "@/features/auth/password-reset"
import { cleanupExpiredRateLimits } from "@/lib/rate-limit"
import { cleanupOldAuditLogs } from "@/lib/audit"
import { expireQuotations } from "@/features/quotations/services/respond"

/**
 * สั่งรันงานตามเวลาเองจากหน้าเว็บ
 *
 * ใช้ฟังก์ชันชุดเดียวกับที่ /api/cron เรียกอยู่แล้ว ไม่ได้เขียนตรรกะใหม่ —
 * บทเรียนจาก groupItems ที่เคยมีห้าก๊อปปี้แล้วผลไม่ตรงกัน
 */

const JOBS = {
  archiveProductViews: {
    label: "สรุปยอดเข้าชมรายวัน",
    run: archiveProductViews,
  },
  cleanupResetTokens: {
    label: "เก็บกวาดลิงก์ตั้งรหัสผ่านที่หมดอายุ",
    run: cleanupExpiredResetTokens,
  },
  cleanupRateLimits: {
    label: "เก็บกวาดตัวนับจำกัดอัตรา",
    run: cleanupExpiredRateLimits,
  },
  expireQuotations: {
    label: "ปิดใบเสนอราคาที่หมดอายุ",
    run: expireQuotations,
  },
  cleanupAuditLogs: {
    label: "ลบประวัติการใช้งานที่เก่ากว่า 1 ปี",
    run: cleanupOldAuditLogs,
  },
} as const

export type JobKey = keyof typeof JOBS

const bodySchema = z.object({
  job: z.enum(["all", ...(Object.keys(JOBS) as [JobKey, ...JobKey[]])]),
})

/** รายชื่องานสำหรับให้หน้าเว็บสร้างปุ่ม */
export async function GET() {
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response

  return apiOk({
    jobs: Object.entries(JOBS).map(([key, job]) => ({ key, label: job.label })),
  })
}

export async function POST(request: Request) {
  try {
    const guard = await requireSuperAdmin()
    if (!guard.ok) return guard.response

    const { job } = bodySchema.parse(await request.json())

    const startedAt = Date.now()
    const result = job === "all" ? await runJobs() : await JOBS[job].run()
    const durationMs = Date.now() - startedAt

    // การสั่งรันเองก็ต้องมีร่องรอย จะได้รู้ว่าตัวเลขเปลี่ยนเพราะใคร
    await recordAuditSafely({
      actorId: guard.user.id,
      action: AUDIT_ACTIONS.SYSTEM_JOB_RUN,
      entityType: "System",
      entityId: job,
      entityLabel: job === "all" ? "งานตามเวลาทั้งหมด" : JOBS[job].label,
      after: { job, durationMs },
      ip: clientIp(request.headers),
    })

    return apiOk({ job, durationMs, result })
  } catch (error) {
    return handleApiError(error, "admin/dev/jobs")
  }
}
