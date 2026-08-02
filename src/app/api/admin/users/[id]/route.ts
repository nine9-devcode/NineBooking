// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { z } from "zod"
import bcrypt from "bcryptjs"

const updateUserSchema = z.object({
  name: z.string().min(3).max(40).optional(),
  nickname: z.string().min(1).max(20).nullable().optional(),
  phone: z.string().length(10).regex(/^[0-9]+$/).nullable().optional(),
  memberType: z.string().nullable().optional(),
  memberTypeNote: z.string().nullable().optional(),
  residenceType: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  subDistrict: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  newPassword: z.string().min(6).max(50).optional(),
})

// GET - ดึงข้อมูลเต็มของสมาชิก 1 คน (ใช้ตอนกดแก้ไข)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        phone: true,
        memberType: true,
        memberTypeNote: true,
        residenceType: true,
        address: true,
        province: true,
        district: true,
        subDistrict: true,
        postalCode: true,
        image: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลสมาชิก" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        ...user,
        orderCount: user._count.orders,
      },
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    )
  }
}

// PATCH - แก้ไขข้อมูลสมาชิก (ข้อมูลส่วนตัว, ที่อยู่, รหัสผ่าน)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response
    const { id } = await params

    const body = await req.json()

    // ตรวจสอบข้อมูลด้วย Zod schema
    const validationResult = updateUserSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // เช็คว่า user มีอยู่จริง
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "ไม่พบข้อมูลสมาชิก" }, { status: 404 })
    }

    // ถ้าส่ง newPassword มา จะ hash ก่อนบันทึก
    const hashedPassword = data.newPassword
      ? await bcrypt.hash(data.newPassword, 12)
      : undefined

    // อัพเดตเฉพาะ field ที่ส่งมา (field ไหนไม่ส่งจะไม่แตะ)
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.nickname !== undefined && { nickname: data.nickname }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.memberType !== undefined && { memberType: data.memberType }),
        ...(data.memberTypeNote !== undefined && { memberTypeNote: data.memberTypeNote || null }),
        ...(data.residenceType !== undefined && { residenceType: data.residenceType }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.province !== undefined && { province: data.province || null }),
        ...(data.district !== undefined && { district: data.district || null }),
        ...(data.subDistrict !== undefined && { subDistrict: data.subDistrict || null }),
        ...(data.postalCode !== undefined && { postalCode: data.postalCode || null }),
        ...(hashedPassword && { password: hashedPassword }),
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        phone: true,
        memberType: true,
        memberTypeNote: true,
        residenceType: true,
        address: true,
        province: true,
        district: true,
        subDistrict: true,
        postalCode: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "อัปเดตข้อมูลสำเร็จ",
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" },
      { status: 500 }
    )
  }
}

// DELETE - ลบสมาชิก (Orders/ContactIssues จะเป็น null, CartItems ลบตาม)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response
    const { id } = await params

    const user = await prisma.user.findUnique({ where: { id } })

    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลสมาชิก" }, { status: 404 })
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "ลบสมาชิกสำเร็จ",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบข้อมูล" },
      { status: 500 }
    )
  }
}