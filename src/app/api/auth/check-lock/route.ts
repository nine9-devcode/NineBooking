import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// POST /api/auth/check-lock
// เช็คว่า email ถูกล็อคจาก brute force หรือไม่
// ไม่ต้อง auth — ไม่เปิดเผยว่า email มีอยู่จริงหรือไม่ (แค่บอกว่าล็อคหรือเปล่า)
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ locked: false })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const rateLimit = await prisma.loginRateLimit.findUnique({
      where: { email: normalizedEmail },
    })

    if (rateLimit?.blockedUntil && rateLimit.blockedUntil > new Date()) {
      return NextResponse.json({
        locked: true,
        blockedUntil: rateLimit.blockedUntil.toISOString(),
      })
    }

    return NextResponse.json({ locked: false })
  } catch {
    return NextResponse.json({ locked: false })
  }
}
