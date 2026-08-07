import { z } from "zod"

import { apiOk, handleApiError, tooManyRequests } from "@/lib/api/response"
import { prisma } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/mailer/auth-mail"
import { RATE_LIMITS, clientIp, consume } from "@/lib/rate-limit"
import { issueResetToken } from "@/features/auth/password-reset"

const bodySchema = z.object({
  email: z.email("รูปแบบอีเมลไม่ถูกต้อง"),
})

// ตอบข้อความเดียวกันเสมอ ไม่ว่าอีเมลนั้นจะมีในระบบหรือไม่
// เพื่อไม่ให้ใครใช้หน้านี้ไล่เช็คว่าอีเมลไหนสมัครไว้แล้วบ้าง
const GENERIC_RESPONSE = {
  message:
    "ถ้าอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว กรุณาตรวจสอบกล่องจดหมาย",
}

// POST /api/auth/forgot-password — ขอลิงก์ตั้งรหัสผ่านใหม่
export async function POST(request: Request) {
  try {
    const rate = await consume(
      `forgot-password:ip:${clientIp(request.headers)}`,
      RATE_LIMITS.forgotPassword
    )
    // ตอบ 429 ตรงๆ ได้ เพราะเพดานผูกกับ IP ของผู้เรียก ไม่ได้บอกว่าอีเมลไหนมีอยู่จริง
    if (!rate.ok) return tooManyRequests(rate.retryAfterSec)

    const { email } = bodySchema.parse(await request.json())

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, name: true, nickname: true, password: true },
    })

    // ไม่มีบัญชี หรือเป็นบัญชีที่ยังไม่มีรหัสผ่าน → เงียบไว้
    if (user?.password) {
      const { token } = await issueResetToken(user.id)

      await sendPasswordResetEmail({
        to: user.email,
        name: user.nickname || user.name || "ผู้ใช้งาน",
        token,
      })
    }

    return apiOk(GENERIC_RESPONSE)
  } catch (error) {
    return handleApiError(error, "auth/forgot-password")
  }
}
