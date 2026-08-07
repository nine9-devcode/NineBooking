import { timingSafeEqual } from "node:crypto"

import { NextRequest } from "next/server"

import { auth } from "@/lib/auth"
import { apiOk, handleApiError, unauthorized } from "@/lib/api/response"
import { env } from "@/lib/env"
import { cleanupExpiredRateLimits } from "@/lib/rate-limit"
import { archiveProductViews } from "@/features/dashboard/archive-product-views"
import { cleanupExpiredResetTokens } from "@/features/auth/password-reset"

/**
 * งานตามเวลาของระบบ — สรุปยอดเข้าชมสินค้ารายวัน + เก็บกวาด token ที่หมดอายุ
 *
 * เดิมใช้ node-cron ที่ instrumentation.ts ซึ่งมีปัญหาสองข้อ:
 * ตัวจับเวลาถูกสร้างซ้ำในทุก worker และไม่ทำงานเลยบน serverless
 * จึงเปลี่ยนมาเป็น endpoint ให้ตัวตั้งเวลาภายนอกเรียกแทน
 *
 * เรียกได้สองทาง:
 *   1. ตัวตั้งเวลาภายนอก — ส่ง header `Authorization: Bearer <CRON_SECRET>`
 *      (Vercel Cron, GitHub Actions, cron ของเครื่อง ฯลฯ)
 *   2. ผู้ดูแลระบบกดปุ่มสั่งรันเองจากหน้าตั้งค่า
 *
 * ตัวอย่าง vercel.json:
 *   { "crons": [{ "path": "/api/cron", "schedule": "0 17 * * *" }] }
 *   (17:00 UTC = เที่ยงคืนตามเวลาไทย)
 */
export const dynamic = "force-dynamic"

/** เทียบแบบใช้เวลาคงที่ ไม่ให้เดาความลับทีละไบต์จากเวลาที่ตอบกลับ */
function secretMatches(header: string | null, secret: string): boolean {
  if (!header) return false

  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(header)

  return expected.length === received.length && timingSafeEqual(expected, received)
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (env.CRON_SECRET && secretMatches(request.headers.get("authorization"), env.CRON_SECRET)) {
    return true
  }

  const session = await auth()
  return session?.user?.role === "admin"
}

async function runJobs() {
  const startedAt = Date.now()

  const [views, tokens, rateLimits] = await Promise.all([
    archiveProductViews(),
    cleanupExpiredResetTokens(),
    cleanupExpiredRateLimits(),
  ])

  return {
    ranAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    archiveProductViews: views,
    expiredResetTokensRemoved: tokens,
    expiredRateLimitsRemoved: rateLimits,
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAuthorized(request))) return unauthorized()
    return apiOk(await runJobs())
  } catch (error) {
    return handleApiError(error, "cron")
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthorized(request))) return unauthorized()
    return apiOk(await runJobs())
  } catch (error) {
    return handleApiError(error, "cron")
  }
}
