import bcrypt from "bcryptjs"

import { apiError, apiOk, handleApiError, tooManyRequests } from "@/lib/api/response"
import { prisma } from "@/lib/db"
import { RATE_LIMITS, clientIp, consume } from "@/lib/rate-limit"
import { registerSchema } from "@/features/auth/schema"

// POST /api/auth/register — สมัครสมาชิกด้วยอีเมล + รหัสผ่าน
export async function POST(request: Request) {
  try {
    // นับก่อน parse เสมอ ไม่งั้นยิงข้อมูลมั่วๆ รัวๆ เพื่อเลี่ยงการนับได้
    // ปลายทางคือ bcrypt cost 12 ซึ่งกิน CPU มากพอจะทำให้เซิร์ฟเวอร์ล่มได้
    const rate = await consume(
      `register:ip:${clientIp(request.headers)}`,
      RATE_LIMITS.register
    )
    if (!rate.ok) return tooManyRequests(rate.retryAfterSec)

    const data = registerSchema.parse(await request.json())

    const normalizedEmail = data.email.toLowerCase().trim()

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (existingUser) return apiError("อีเมลนี้ถูกใช้งานแล้ว")

    const user = await prisma.user.create({
      data: {
        name: data.name,
        nickname: data.nickname,
        email: normalizedEmail,
        password: await bcrypt.hash(data.password, 12),
        phone: data.phone,
        residenceType: data.residenceType,
        // ฟอร์มเก็บค่านี้มาตั้งแต่แรกแต่ schema ฝั่ง API ไม่มี ค่าจึงหายไปเงียบๆ
        residenceTypeOther: data.residenceTypeOther || null,
        role: "user",
        isProfileCompleted: true,
        address: data.address || null,
        province: data.province || null,
        district: data.district || null,
        subDistrict: data.subDistrict || null,
        postalCode: data.postalCode || null,
      },
      // เลือกฟิลด์ที่ส่งกลับเอง จะได้ไม่มีทางหลุด password hash ออกไป
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })

    return apiOk({ message: "สมัครสมาชิกสำเร็จ", user }, 201)
  } catch (error) {
    return handleApiError(error, "auth/register")
  }
}
