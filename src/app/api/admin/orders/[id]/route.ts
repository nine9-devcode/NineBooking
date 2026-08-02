// ไฟล์: app/api/admin/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { z } from "zod"

// Schema สำหรับอัพเดท Order
const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  adminNote: z.string().nullable().optional(),
})

// Group order items
function groupOrderItems(
  orderItems: {
    id: string
    productId: string
    productName: string
    productImage: string | null
    pairedProductId: string | null
    pairedProductName: string | null
    pairedProductImage: string | null
    quantity: number
    createdAt: Date
    product?: {
      id: string
      slug: string | null
      isActive: boolean
      category?: { name: string } | null
    } | null
    pairedProduct?: {
      id: string
      slug: string | null
      isActive: boolean
    } | null
  }[]
) {
  const GROUP_TIME_THRESHOLD = 5000 // 5 วินาที

  // Sort by createdAt
  const sortedItems = [...orderItems].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  interface GroupedItem {
    groupId: string
    productId: string
    product: {
      id: string
      name: string
      image: string | null
      slug: string | null
      isActive: boolean
      category: string | null
    }
    mainQuantity: number
    pairedItems: {
      id: string
      quantity: number
      pairedProduct: {
        id: string
        name: string
        image: string | null
        slug: string | null
        isActive: boolean
      }
    }[]
    createdAt: Date
  }

  const groups: GroupedItem[] = []
  let currentGroup: GroupedItem | null = null

  for (const item of sortedItems) {
    const itemTime = new Date(item.createdAt).getTime()

    // ตรวจสอบว่าควรรวมกับ group ปัจจุบันหรือไม่
    const shouldJoinGroup =
      currentGroup &&
      currentGroup.productId === item.productId &&
      itemTime - new Date(currentGroup.createdAt).getTime() <= GROUP_TIME_THRESHOLD

    if (shouldJoinGroup && currentGroup) {
      // รวมเข้า group เดิม
      if (item.pairedProductId && item.pairedProductName) {
        // เป็นสินค้าคู่
        currentGroup.pairedItems.push({
          id: item.id,
          quantity: item.quantity,
          pairedProduct: {
            id: item.pairedProductId,
            name: item.pairedProductName,
            image: item.pairedProductImage,
            slug: item.pairedProduct?.slug || null,
            isActive: item.pairedProduct?.isActive ?? false,
          },
        })
      } else {
        // เป็นสินค้าหลัก
        currentGroup.mainQuantity += item.quantity
      }
    } else {
      // สร้าง group ใหม่
      currentGroup = {
        groupId: `${item.productId}-${item.createdAt.toISOString()}`,
        productId: item.productId,
        product: {
          id: item.productId,
          name: item.productName,
          image: item.productImage,
          slug: item.product?.slug || null,
          isActive: item.product?.isActive ?? false,
          category: item.product?.category?.name || null,
        },
        mainQuantity: 0,
        pairedItems: [],
        createdAt: item.createdAt,
      }

      if (item.pairedProductId && item.pairedProductName) {
        // เป็นสินค้าคู่
        currentGroup.pairedItems.push({
          id: item.id,
          quantity: item.quantity,
          pairedProduct: {
            id: item.pairedProductId,
            name: item.pairedProductName,
            image: item.pairedProductImage,
            slug: item.pairedProduct?.slug || null,
            isActive: item.pairedProduct?.isActive ?? false,
          },
        })
      } else {
        // เป็นสินค้าหลัก
        currentGroup.mainQuantity = item.quantity
      }

      groups.push(currentGroup)
    }
  }

  return groups
}

// GET - ดึงรายละเอียด Order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
            image: true,
            residenceType: true,
            createdAt: true,
            memberType: true,
            memberTypeNote: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                isActive: true,
                category: {
                  select: { name: true },
                },
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
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งจอง" }, { status: 404 })
    }

    // Group order items
    const groupedItems = groupOrderItems(order.orderItems)

    // คำนวณ summary
    let totalMainQuantity = 0
    let totalPairedQuantity = 0

    for (const group of groupedItems) {
      totalMainQuantity += group.mainQuantity
      totalPairedQuantity += group.pairedItems.reduce((sum, p) => sum + p.quantity, 0)
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,

        // ข้อมูลผู้จอง (snapshot)
        customer: {
          name: order.customerName,
          nickname: order.customerNickname,
          email: order.customerEmail,
          phone: order.customerPhone,

        },

        // ที่อยู่จัดส่ง
        shipping: {
          address: order.shippingAddress,
          province: order.shippingProvince,
          district: order.shippingDistrict,
          subDistrict: order.shippingSubDistrict,
          postalCode: order.shippingPostalCode,
          residenceType: order.shippingResidenceType,
        },

        // ข้อมูล User (จาก relation)
        user: order.user ? {
          id: order.user.id,
          name: order.user.name,
          nickname: order.user.nickname,
          email: order.user.email,
          image: order.user.image,
          residenceType: order.user.residenceType,
          memberSince: order.user.createdAt,
          memberType: order.user.memberType,
          memberTypeNote: order.user.memberTypeNote,
        }: null,

        // การยกเลิก
        cancelledBy: order.cancelledBy ?? null,

        // หมายเหตุ
        customerNote: order.customerNote,
        adminNote: order.adminNote,

        // รายการสินค้า (grouped)
        items: groupedItems.map((group) => ({
          groupId: group.groupId,
          productId: group.productId,
          product: group.product,
          mainQuantity: group.mainQuantity,
          pairedItems: group.pairedItems,
        })),

        // สรุป
        totalItems: groupedItems.length,
        totalQuantity: totalMainQuantity + totalPairedQuantity,
        mainQuantity: totalMainQuantity,
        pairedQuantity: totalPairedQuantity,

        // เวลา
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    )
  }
}

// PATCH - อัพเดท Order (status, adminNote)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params
    const body = await request.json()

    // Validate
    const validationResult = updateOrderSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        orderNumber: true,
        status: true,
      },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "ไม่พบคำสั่งจอง" }, { status: 404 })
    }

    const oldStatus = existingOrder.status

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.adminNote !== undefined && { adminNote: data.adminNote }),
        ...(data.status === "CANCELLED" && { cancelledBy: "ADMIN" }),
      },
    })

    // สร้าง notification
    if (data.status && data.status !== oldStatus && existingOrder.userId) {
      await prisma.userOrderNotification.create({
        data: {
          userId: existingOrder.userId,
          orderId: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          oldStatus: oldStatus,
          newStatus: data.status,
        },
      })

      console.log(
        `Created notification for user ${existingOrder.userId}: ${existingOrder.orderNumber} ${oldStatus} -> ${data.status}`
      )
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        adminNote: updatedOrder.adminNote,
        updatedAt: updatedOrder.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล" },
      { status: 500 }
    )
  }
}