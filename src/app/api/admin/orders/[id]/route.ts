// ไฟล์: app/api/admin/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { apiError } from "@/lib/api/response"
import { AUDIT_ACTIONS, recordAudit } from "@/lib/audit"
import { prisma } from "@/lib/db"
import { clientIp } from "@/lib/rate-limit"
import { InvalidTransitionError, assertTransition } from "@/features/orders/order-status"
import { z } from "zod"
import { groupOrderItems, summarizeOrderItems } from "@/features/orders/group-items"

// Schema สำหรับอัพเดท Order
const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  adminNote: z.string().nullable().optional(),
  // บังคับกรอกเมื่อยกเลิก — ของเดิมยกเลิกได้โดยไม่ต้องบอกเหตุผล
  // ทำให้ตอบลูกค้าไม่ได้ว่าทำไมคำสั่งจองถึงถูกยกเลิก
  cancelReason: z.string().trim().min(5, "กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร").optional(),
})

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

    const groupedItems = groupOrderItems(order.orderItems)
    const { mainQuantity: totalMainQuantity, pairedQuantity: totalPairedQuantity } =
      summarizeOrderItems(groupedItems)

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
        user: order.user
          ? {
              id: order.user.id,
              name: order.user.name,
              nickname: order.user.nickname,
              email: order.user.email,
              image: order.user.image,
              residenceType: order.user.residenceType,
              memberSince: order.user.createdAt,
              memberType: order.user.memberType,
              memberTypeNote: order.user.memberTypeNote,
            }
          : null,

        // การยกเลิก
        cancelledBy: order.cancelledBy ?? null,

        // หมายเหตุ
        customerNote: order.customerNote,
        adminNote: order.adminNote,

        // รายการสินค้า (grouped)
        items: groupedItems.map((group) => {
          // relation ของสินค้ามาจากแถวแรกของกลุ่ม — ทุกแถวในกลุ่มเป็นสินค้าตัวเดียวกัน
          const source = group.mainItems[0] ?? group.pairedItems[0]?.item

          return {
            groupId: group.groupId,
            productId: group.productId,
            product: source?.product
              ? {
                  id: source.product.id,
                  name: group.productName,
                  image: group.productImage,
                  slug: source.product.slug,
                  isActive: source.product.isActive,
                  category: source.product.category?.name ?? null,
                }
              : // สินค้าถูกลบไปแล้ว — ยังแสดงชื่อกับรูปที่ snapshot ไว้ได้ แต่ลิงก์ไปไม่ได้
                {
                  id: null,
                  name: group.productName,
                  image: group.productImage,
                  slug: null,
                  isActive: false,
                  category: null,
                },
            mainQuantity: group.mainQuantity,
            pairedItems: group.pairedItems.map((paired) => ({
              id: paired.itemId,
              quantity: paired.quantity,
              pairedProduct: {
                id: paired.item.pairedProduct?.id ?? null,
                name: paired.name,
                image: paired.image,
                slug: paired.item.pairedProduct?.slug ?? null,
                isActive: paired.item.pairedProduct?.isActive ?? false,
              },
            })),
          }
        }),

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
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 })
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
    const statusChanged = Boolean(data.status && data.status !== oldStatus)

    // ตรวจกฎการเปลี่ยนสถานะก่อนแตะฐานข้อมูล
    // ของเดิมเขียนค่าใหม่ทับโดยไม่ดูของเดิม จึงย้อนจาก CANCELLED กลับไป
    // COMPLETED ได้ ซึ่งทำให้รายงานอ่านไม่รู้เรื่อง
    if (data.status) {
      try {
        assertTransition(oldStatus, data.status)
      } catch (error) {
        if (error instanceof InvalidTransitionError) return apiError(error.message)
        throw error
      }
    }

    if (data.status === "CANCELLED" && !data.cancelReason) {
      return apiError("กรุณาระบุเหตุผลในการยกเลิก")
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: {
          ...(data.status && { status: data.status }),
          ...(data.adminNote !== undefined && { adminNote: data.adminNote }),
          ...(data.status === "CANCELLED" && {
            cancelledBy: "ADMIN" as const,
            cancelledAt: new Date(),
            cancelReason: data.cancelReason,
          }),
          // ออกจากสถานะยกเลิกแล้วต้องล้างข้อมูลการยกเลิกด้วย
          // ไม่งั้นใบที่ฟื้นมาจะขึ้นว่า "ยกเลิกโดยแอดมิน" ตลอดไป
          ...(statusChanged &&
            data.status !== "CANCELLED" &&
            oldStatus === "CANCELLED" && {
              cancelledBy: null,
              cancelledAt: null,
              cancelReason: null,
            }),
        },
      })

      if (statusChanged && data.status && existingOrder.userId) {
        await tx.userOrderNotification.create({
          data: {
            userId: existingOrder.userId,
            orderId: existingOrder.id,
            orderNumber: existingOrder.orderNumber,
            oldStatus,
            newStatus: data.status,
          },
        })
      }

      if (statusChanged && data.status) {
        await recordAudit(tx, {
          actorId: guard.user.id,
          action:
            data.status === "CANCELLED"
              ? AUDIT_ACTIONS.ORDER_CANCELLED
              : AUDIT_ACTIONS.ORDER_STATUS_CHANGED,
          entityType: "Order",
          entityId: id,
          before: { status: oldStatus },
          after: {
            status: data.status,
            ...(data.cancelReason && { cancelReason: data.cancelReason }),
          },
          ip: clientIp(request.headers),
        })
      }

      return order
    })

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
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล" }, { status: 500 })
  }
}
