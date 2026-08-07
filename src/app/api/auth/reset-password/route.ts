import bcrypt from "bcryptjs"
import { z } from "zod"

import { apiError, apiOk, handleApiError } from "@/lib/api/response"
import { prisma } from "@/lib/db"
import { consumeResetToken, verifyResetToken } from "@/features/auth/password-reset"

const bodySchema = z.object({
  token: z.string().min(1, "ไม่พบ token"),
  password: z
    .string()
    .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
    .max(50, "รหัสผ่านต้องไม่เกิน 50 ตัวอักษร"),
})

const REASON_MESSAGES = {
  invalid: "ลิงก์ไม่ถูกต้อง กรุณาขอลิงก์ใหม่",
  expired: "ลิงก์หมดอายุแล้ว กรุณาขอลิงก์ใหม่",
  used: "ลิงก์นี้ถูกใช้ไปแล้ว กรุณาขอลิงก์ใหม่",
} as const

// GET /api/auth/reset-password?token=... — เช็คว่าลิงก์ยังใช้ได้ไหม (ก่อนแสดงฟอร์ม)
export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token")
    if (!token) return apiError(REASON_MESSAGES.invalid)

    const check = await verifyResetToken(token)
    if (!check.valid) return apiError(REASON_MESSAGES[check.reason])

    return apiOk({ valid: true })
  } catch (error) {
    return handleApiError(error, "auth/reset-password:check")
  }
}

// POST /api/auth/reset-password — ตั้งรหัสผ่านใหม่
export async function POST(request: Request) {
  try {
    const { token, password } = bodySchema.parse(await request.json())

    const check = await verifyResetToken(token)
    if (!check.valid) return apiError(REASON_MESSAGES[check.reason])

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: check.userId },
        data: { password: hashedPassword },
        select: { email: true },
      })

      // ปลดล็อคบัญชีที่โดนล็อคจากการกรอกรหัสผิด — เจ้าของยืนยันตัวตนผ่านอีเมลแล้ว
      await tx.rateLimit.deleteMany({ where: { key: `login:email:${user.email}` } })
    })

    await consumeResetToken(check.tokenId)

    return apiOk({ message: "ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง" })
  } catch (error) {
    return handleApiError(error, "auth/reset-password")
  }
}
