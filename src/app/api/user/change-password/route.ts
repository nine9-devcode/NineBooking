import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      )
    }

    // ดึงข้อมูล user
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลผู้ใช้" },
        { status: 404 }
      )
    }

    // บัญชีที่ไม่มีรหัสผ่าน (เช่น admin ที่ถูกสร้างไว้แต่ยังไม่ตั้งรหัส)
    if (!user.password) {
      return NextResponse.json(
        { error: "บัญชีนี้ยังไม่ได้ตั้งรหัสผ่าน กรุณาใช้ลิงก์ตั้งรหัสผ่านจากหน้าลืมรหัสผ่าน" },
        { status: 400 }
      )
    }

    // ตรวจสอบรหัสผ่านปัจจุบัน
    const isCorrectPassword = await bcrypt.compare(currentPassword, user.password)

    if (!isCorrectPassword) {
      return NextResponse.json(
        { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" },
        { status: 400 }
      )
    }

    // Hash รหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // อัพเดทรหัสผ่าน
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    })

    return NextResponse.json({
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    )
  }
}