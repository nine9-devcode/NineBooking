import { NextRequest, NextResponse } from "next/server"
import { OrderStatus, Prisma } from "@prisma/client"
import { z } from "zod"

import { parseEnumParam, parsePagination } from "@/lib/api/query"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { nextOrderNumber } from "@/lib/document-number"
import {
  groupOrderItems,
  summarizeOrderItems,
  toEmailItems,
} from "@/features/orders/group-items"
import { sendOrderEmails } from "@/lib/mailer/order-mail"
import { notifyAdmins } from "@/lib/realtime/order-notifications"

// Schema สำหรับสร้าง Order
const createOrderSchema = z.object({
  // ข้อมูลผู้จอง
  customerName: z.string().min(1, "กรุณากรอกชื่อ"),
  customerNickname: z.string().optional(),
  customerEmail: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  customerPhone: z.string().min(9, "กรุณากรอกเบอร์โทรศัพท์"),

  // ที่อยู่จัดส่ง
  shippingAddress: z.string().optional(),
  shippingProvince: z.string().optional(),
  shippingDistrict: z.string().optional(),
  shippingSubDistrict: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingResidenceType: z.string().optional(),

  // หมายเหตุ
  customerNote: z.string().optional(),

  // รายการสินค้าจากตะกร้า (cart item IDs ที่เลือก)
  cartItemIds: z.array(z.string()).min(1, "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ"),
})

// POST - สร้างคำสั่งจอง
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    // Validate input
    const validationResult = createOrderSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // ดึง CartItems ที่เลือก
    const cartItems = await prisma.cartItem.findMany({
      where: {
        id: { in: data.cartItemIds },
        userId: userId, // ต้องเป็นของ user นี้เท่านั้น
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            isActive: true,
          },
        },
        pairedProduct: {
          select: {
            id: true,
            name: true,
            image: true,
            isActive: true,
          },
        },
      },
    })

    // ตรวจสอบว่ามี items
    if (cartItems.length === 0) {
      return NextResponse.json({ error: "ไม่พบสินค้าในตะกร้า" }, { status: 400 })
    }

    // ตรวจสอบว่าสินค้ายัง active อยู่
    const inactiveProducts = cartItems.filter(
      (item) =>
        !item.product.isActive ||
        (item.pairedProduct && !item.pairedProduct.isActive)
    )

    if (inactiveProducts.length > 0) {
      return NextResponse.json(
        { error: "บางสินค้าไม่พร้อมจำหน่ายแล้ว กรุณาตรวจสอบตะกร้าอีกครั้ง" },
        { status: 400 }
      )
    }

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    // สร้างเลขที่ใบจอง + Order + OrderItems + กระดิ่งแจ้งเตือน ในทรานแซกชันเดียว
    //
    // เลขที่ใบจองต้องขอ "ข้างใน" ทรานแซกชันนี้ ของเดิมนับ order ของวันนี้แล้ว +1
    // ไว้ข้างนอก ทำให้คนที่กด checkout พร้อมกันได้เลขเดียวกัน ตัวที่เขียนทีหลัง
    // ไปชน unique constraint แล้วพังทั้งคำสั่ง — และเพราะพังหลังจากนั้น
    // ตะกร้าก็ไม่ถูกล้าง ลูกค้าเลยไม่รู้ว่าสั่งติดหรือไม่ติด
    const { order, notification } = await prisma.$transaction(async (tx) => {
      const orderNumber = await nextOrderNumber(tx)

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          customerName: data.customerName,
          customerNickname: data.customerNickname || null,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          shippingAddress: data.shippingAddress || null,
          shippingProvince: data.shippingProvince || null,
          shippingDistrict: data.shippingDistrict || null,
          shippingSubDistrict: data.shippingSubDistrict || null,
          shippingPostalCode: data.shippingPostalCode || null,
          shippingResidenceType: data.shippingResidenceType || null,
          customerNote: data.customerNote || null,
          status: "PENDING",
          orderItems: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              pairedProductId: item.pairedProductId,
              quantity: item.quantity,
              // Snapshot
              productName: item.product.name,
              productImage: item.product.image,
              pairedProductName: item.pairedProduct?.name || null,
              pairedProductImage: item.pairedProduct?.image || null,
            })),
          },
        },
        include: {
          orderItems: true,
        },
      })

      await tx.cartItem.deleteMany({
        where: {
          id: { in: data.cartItemIds },
          userId: userId,
        },
      })

      const newNotification = await tx.orderNotification.create({
        data: {
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          customerName: newOrder.customerName,
          customerNickname: newOrder.customerNickname || newOrder.customerName,
          totalItems,
        },
      })

      return { order: newOrder, notification: newNotification }
    })

    // กระดิ่ง real-time ส่งหลัง commit เท่านั้น
    // ไม่งั้นแอดมินอาจเห็นแจ้งเตือนของคำสั่งจองที่สุดท้าย rollback ไป
    notifyAdmins({
      id: notification.id,
      orderId: notification.orderId,
      orderNumber: notification.orderNumber,
      customerName: notification.customerName,
      customerNickname: notification.customerNickname,
      totalItems: notification.totalItems,
      isRead: false,
      createdAt: notification.createdAt.toISOString(),
    })

    const groupedItemsForEmail = toEmailItems(groupOrderItems(order.orderItems))

    const totalMainQuantity = groupedItemsForEmail.reduce((sum, g) => sum + g.mainQuantity, 0)
    const totalPairedQuantity = groupedItemsForEmail.reduce(
      (sum, g) => sum + (g.pairedProducts?.reduce((s, p) => s + p.quantity, 0) || 0),
      0
    )

    // อีเมลไม่ควรบล็อกการตอบกลับ — ล้มเหลวก็แค่ log ไว้
    void sendOrderEmails({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerNickname: order.customerNickname,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      orderItems: groupedItemsForEmail,
      shippingAddress: order.shippingAddress,
      shippingProvince: order.shippingProvince,
      shippingDistrict: order.shippingDistrict,
      shippingSubDistrict: order.shippingSubDistrict,
      shippingPostalCode: order.shippingPostalCode,
      shippingResidenceType: order.shippingResidenceType,
      customerNote: order.customerNote,
      totalMainQuantity,
      totalPairedQuantity,
      totalQuantity: totalMainQuantity + totalPairedQuantity,
      createdAt: order.createdAt,
    }).catch((error: unknown) => {
      console.error("[orders] ส่งอีเมลยืนยันไม่สำเร็จ:", error)
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        itemCount: order.orderItems.length,
        createdAt: order.createdAt,
      },
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างคำสั่งจอง" },
      { status: 500 }
    )
  }
}

// GET - ดึงประวัติการจอง
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)

    const { page, limit, skip } = parsePagination(searchParams)
    const search = searchParams.get("search")?.trim() || ""
    const sortOrder = searchParams.get("sort") === "asc" ? ("asc" as const) : ("desc" as const)

    // ใช้ type ของ Prisma แทน any เพื่อให้ค่าที่มาจาก query string ถูกตรวจตอน compile
    const where: Prisma.OrderWhereInput = { userId }

    // parseEnumParam คืน undefined ถ้าค่าไม่ตรง enum — ของเดิมยัดค่าดิบเข้าไปแล้วพังเป็น 500
    const status = parseEnumParam(OrderStatus, searchParams.get("status"))
    if (status) where.status = status

    if (search) {
      where.orderNumber = { contains: search, mode: "insensitive" }
    }

    // Count total
    const total = await prisma.order.count({ where })

    // Get orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: { orderItems: true },
        },
      },
      orderBy: { createdAt: sortOrder },
      skip,
      take: limit,
    })

    return NextResponse.json({
      orders: orders.map((order) => {
        const groupedItems = groupOrderItems(order.orderItems)
        const summary = summarizeOrderItems(groupedItems)

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          itemCount: summary.productCount,
          totalQuantity: summary.totalQuantity,
          mainQuantity: summary.mainQuantity,
          pairedQuantity: summary.pairedQuantity,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          // Preview items (แสดง 3 รายการแรก - grouped)
          previewItems: groupedItems.slice(0, 3).map((group) => ({
            productName: group.productName,
            productImage: group.productImage,
            quantity: group.mainQuantity || 1,
            pairedCount: group.pairedItems.length,
            pairedProducts: group.pairedItems.slice(0, 3).map((paired) => ({
              name: paired.name,
              image: paired.image,
              quantity: paired.quantity,
            })),
          })),
        }
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    )
  }
}