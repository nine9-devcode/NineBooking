// ไฟล์: app/api/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET - ดึงรายละเอียดคำสั่งจอง
export async function GET(
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

    // ดึง Order พร้อม items
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                isActive: true,
              },
            },
            pairedProduct: {
              select: {
                id: true,
                slug: true,
                isActive: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งจอง" }, { status: 404 })
    }

    // ตรวจสอบว่าเป็น order ของ user นี้
    if (order.userId !== userId) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ดูคำสั่งจองนี้" }, { status: 403 })
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,

        // ข้อมูลผู้จอง
        customerName: order.customerName,
        customerNickname: order.customerNickname,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,

        // ที่อยู่
        shippingAddress: order.shippingAddress,
        shippingProvince: order.shippingProvince,
        shippingDistrict: order.shippingDistrict,
        shippingSubDistrict: order.shippingSubDistrict,
        shippingPostalCode: order.shippingPostalCode,
        shippingResidenceType: order.shippingResidenceType,

        // หมายเหตุ
        customerNote: order.customerNote,
        adminNote: order.adminNote,

        // รายการสินค้า
        items: order.orderItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,

          // สินค้าหลัก
          product: {
            id: item.productId,
            name: item.productName,
            image: item.productImage,
            slug: item.product?.slug || null,
            isActive: item.product?.isActive ?? false,
          },

          // สินค้าคู่
          pairedProduct: item.pairedProductId
            ? {
                id: item.pairedProductId,
                name: item.pairedProductName,
                image: item.pairedProductImage,
                slug: item.pairedProduct?.slug || null,
                isActive: item.pairedProduct?.isActive ?? false,
              }
            : null,
        })),

        // สรุป
        totalItems: order.orderItems.length,
        totalQuantity: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),

        // เวลา
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 })
  }
}

// PATCH - ยกเลิกคำสั่งจอง (เฉพาะสถานะ PENDING)
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
    const { action } = body

    // ตรวจสอบ action
    if (action !== "cancel") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // ดึง Order
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        orderNumber: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งจอง" }, { status: 404 })
    }

    // ตรวจสอบว่าเป็น order ของ user นี้
    if (order.userId !== userId) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ยกเลิกคำสั่งจองนี้" }, { status: 403 })
    }

    // ตรวจสอบว่าสถานะเป็น PENDING เท่านั้น
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "ไม่สามารถยกเลิกคำสั่งจองที่ดำเนินการแล้วได้" },
        { status: 400 }
      )
    }

    // อัพเดทสถานะเป็น CANCELLED
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledBy: "CUSTOMER",
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        updatedAt: true,
      },
    })

    console.log(`Order ${order.orderNumber} cancelled by user ${userId}`)

    return NextResponse.json({
      success: true,
      message: "ยกเลิกคำสั่งจองเรียบร้อยแล้ว",
      order: updatedOrder,
    })
  } catch (error) {
    console.error("Error cancelling order:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการยกเลิกคำสั่งจอง" }, { status: 500 })
  }
}
