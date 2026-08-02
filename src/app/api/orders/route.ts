import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { notifyAdmins } from '@/app/api/admin/notifications/stream/route'
import { sendOrderEmails } from '@/lib/mailer/order-mail'

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

// Helper: สร้างเลขที่ใบจอง
async function generateOrderNumber(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "") // 20260107

  // นับจำนวน orders วันนี้
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  const countToday = await prisma.order.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  })

  const sequence = String(countToday + 1).padStart(3, "0") // 001, 002, ...
  return `ORD-${dateStr}-${sequence}`
}

// Helper: แปลง orderItems เป็นรูปแบบสำหรับอีเมล
const groupOrderItemsForEmail = (
  items: Array<{
    productId: string
    productName: string
    productImage: string | null
    pairedProductId: string | null
    pairedProductName: string | null
    pairedProductImage: string | null
    quantity: number
  }>
) => {
  const grouped = new Map<
    string,
    {
      productName: string
      productImage: string | null
      mainQuantity: number
      pairedProducts: Array<{
        name: string
        image: string | null
        quantity: number
      }>
    }
  >()

  for (const item of items) {
    const productId = item.productId

    if (!grouped.has(productId)) {
      grouped.set(productId, {
        productName: item.productName,
        productImage: item.productImage,
        mainQuantity: 0,
        pairedProducts: [],
      })
    }

    const group = grouped.get(productId)!

    if (item.pairedProductName) {
      // เป็นสินค้าคู่
      group.pairedProducts.push({
        name: item.pairedProductName,
        image: item.pairedProductImage,
        quantity: item.quantity,
      })
    } else {
      // เป็นสินค้าหลัก
      group.mainQuantity += item.quantity
    }
  }

  return Array.from(grouped.values())
}

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

    // สร้างเลขที่ใบจอง
    const orderNumber = await generateOrderNumber()

    // สร้าง Order + OrderItems ใน transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. สร้าง Order
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

      // 2. ลบ CartItems ที่ checkout แล้ว
      await tx.cartItem.deleteMany({
        where: {
          id: { in: data.cartItemIds },
          userId: userId,
        },
      })

      return newOrder
    })
  
    // สร้าง notification
const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)           

const notification = await prisma.orderNotification.create({
  data: {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerNickname: order.customerNickname || order.customerName,
    totalItems: totalItems,
  },
})
// ส่ง real-time notification
notifyAdmins({
  id: notification.id,
  orderId: notification.orderId,
  orderNumber: notification.orderNumber,
  customerName: notification.customerName,
  totalItems: notification.totalItems,
  isRead: false,
  createdAt: notification.createdAt.toISOString(),
})

// ส่งอีเมลแจ้งเตือน
const groupedItemsForEmail = groupOrderItemsForEmail(order.orderItems)

const totalMainQuantity = groupedItemsForEmail.reduce(
  (sum, g) => sum + g.mainQuantity,
  0
)
const totalPairedQuantity = groupedItemsForEmail.reduce(
  (sum, g) => sum + (g.pairedProducts?.reduce((s, p) => s + p.quantity, 0) || 0),
  0
)

// ส่งอีเมล (non-blocking - ไม่กระทบการสร้าง order)
sendOrderEmails({
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
  // แค่ log error ไม่ throw เพื่อไม่ให้กระทบ order creation
  console.error('Failed to send emails:', error)
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

// Group items by productId
const groupOrderItems = (
  items: {
    productId: string
    productName: string
    productImage: string | null
    pairedProductId: string | null
    pairedProductName: string | null
    pairedProductImage: string | null
    quantity: number
  }[]
) => {
  const grouped = new Map<
    string,
    {
      productId: string
      productName: string
      productImage: string | null
      mainQuantity: number
      pairedProducts: {
        name: string
        image: string | null
        quantity: number
      }[]
    }
  >()

  for (const item of items) {
    const productId = item.productId

    if (!grouped.has(productId)) {
      grouped.set(productId, {
        productId,
        productName: item.productName,
        productImage: item.productImage,
        mainQuantity: 0,
        pairedProducts: [],
      })
    }

    const group = grouped.get(productId)!

    if (item.pairedProductName) {
      // สินค้าคู่
      group.pairedProducts.push({
        name: item.pairedProductName,
        image: item.pairedProductImage,
        quantity: item.quantity,
      })
    } else {
      // สินค้าหลัก
      group.mainQuantity += item.quantity
    }
  }

  return Array.from(grouped.values())
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

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") // PENDING, CONFIRMED, etc.
    const search = searchParams.get("search")?.trim() || ""
    const sortOrder = searchParams.get("sort") === "asc" ? "asc" as const : "desc" as const

    // Build where clause
    const where: any = { userId }

    if (status && status !== "all") {
      where.status = status
    }

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
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      orders: orders.map((order) => {
        // Group items
        const groupedItems = groupOrderItems(order.orderItems)

        // คำนวณจำนวนรวม
        const totalMainQuantity = groupedItems.reduce(
          (sum, g) => sum + g.mainQuantity,
          0
        )
        const totalPairedQuantity = groupedItems.reduce(
          (sum, g) => sum + g.pairedProducts.reduce((s, p) => s + p.quantity, 0),
          0
        )

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          itemCount: groupedItems.length, // จำนวนสินค้าหลัก (grouped)
          totalQuantity: totalMainQuantity + totalPairedQuantity,
          mainQuantity: totalMainQuantity,
          pairedQuantity: totalPairedQuantity,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          // Preview items (แสดง 3 รายการแรก - grouped)
          previewItems: groupedItems.slice(0, 3).map((group) => ({
            productName: group.productName,
            productImage: group.productImage,
            quantity: group.mainQuantity || 1,
            pairedCount: group.pairedProducts.length,
            pairedProducts: group.pairedProducts.slice(0, 3), // แสดงคู่จับ 3 อันแรก
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