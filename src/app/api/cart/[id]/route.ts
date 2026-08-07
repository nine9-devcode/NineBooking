import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

// Schema สำหรับอัพเดท cart item
const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(99, "จำนวนสูงสุดคือ 99 ชิ้น").optional(),
  pairedProductId: z.string().nullable().optional(),
})

// PATCH - อัพเดท cart item (quantity, paired product)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = await params
    const body = await request.json()

    // Validate input
    const validationResult = updateCartItemSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { quantity, pairedProductId } = validationResult.data

    // ตรวจสอบว่า cart item เป็นของ user นี้
    const existingCartItem = await prisma.cartItem.findUnique({
      where: { id },
    })

    if (!existingCartItem) {
      return NextResponse.json({ error: "ไม่พบรายการในตะกร้า" }, { status: 404 })
    }

    if (existingCartItem.userId !== userId) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไขรายการนี้" }, { status: 403 })
    }

    // ตรวจสอบ paired product (ถ้ามีการเปลี่ยน)
    if (pairedProductId !== undefined && pairedProductId !== null) {
      const pairedProduct = await prisma.product.findUnique({
        where: { id: pairedProductId },
        select: { id: true, isActive: true },
      })

      if (!pairedProduct || !pairedProduct.isActive) {
        return NextResponse.json({ error: "สินค้าที่จับคู่ไม่พร้อมใช้งาน" }, { status: 400 })
      }
    }

    // อัพเดท cart item
    const updateData: any = {}
    if (quantity !== undefined) updateData.quantity = quantity
    if (pairedProductId !== undefined) updateData.pairedProductId = pairedProductId

    const cartItem = await prisma.cartItem.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            subtitle: true,
            slug: true,
            image: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        pairedProduct: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // นับจำนวนรวม
    const totalItems = await prisma.cartItem.aggregate({
      where: { userId },
      _sum: { quantity: true },
    })

    return NextResponse.json({
      cartItem,
      totalItems: totalItems._sum.quantity || 0,
      message: "อัพเดทเรียบร้อยแล้ว",
    })
  } catch (error) {
    console.error("Error updating cart item:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัพเดท" }, { status: 500 })
  }
}

// DELETE - ลบ cart item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = await params

    // ตรวจสอบว่า cart item เป็นของ user นี้
    const existingCartItem = await prisma.cartItem.findUnique({
      where: { id },
    })

    if (!existingCartItem) {
      return NextResponse.json({ error: "ไม่พบรายการในตะกร้า" }, { status: 404 })
    }

    if (existingCartItem.userId !== userId) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ลบรายการนี้" }, { status: 403 })
    }

    // ลบ cart item
    await prisma.cartItem.delete({
      where: { id },
    })

    // นับจำนวนรวมที่เหลือ
    const totalItems = await prisma.cartItem.aggregate({
      where: { userId },
      _sum: { quantity: true },
    })

    return NextResponse.json({
      message: "ลบออกจากตะกร้าแล้ว",
      totalItems: totalItems._sum.quantity || 0,
    })
  } catch (error) {
    console.error("Error deleting cart item:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบรายการ" }, { status: 500 })
  }
}
