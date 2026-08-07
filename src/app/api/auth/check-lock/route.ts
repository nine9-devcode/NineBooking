import { z } from "zod"

import { apiOk, handleApiError } from "@/lib/api/response"
import { prisma } from "@/lib/db"

const bodySchema = z.object({ email: z.string().optional() })

// POST /api/auth/check-lock
// หน้า login เรียกตัวนี้เพื่อบอกผู้ใช้ว่าต้องรออีกนานเท่าไร
//
// ไม่ต้องล็อกอินก็เรียกได้ และไม่เปิดเผยว่ามีบัญชีนี้อยู่จริงไหม เพราะตัวนับ
// ถูกสร้างขึ้นสำหรับอีเมลที่ไม่มีในระบบด้วยเหมือนกัน
export async function POST(req: Request) {
  try {
    const { email } = bodySchema.parse(await req.json().catch(() => ({})))

    if (!email) return apiOk({ locked: false })

    const record = await prisma.rateLimit.findUnique({
      where: { key: `login:email:${email.toLowerCase().trim()}` },
    })

    if (record?.blockedUntil && record.blockedUntil > new Date()) {
      return apiOk({ locked: true, blockedUntil: record.blockedUntil.toISOString() })
    }

    return apiOk({ locked: false })
  } catch (error) {
    return handleApiError(error, "auth/check-lock")
  }
}
