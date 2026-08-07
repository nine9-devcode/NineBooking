import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { OrderStatus, Prisma } from "@prisma/client"
import { parseEnumParam, parsePagination } from "@/lib/api/query"
import { groupOrderItems, summarizeOrderItems } from "@/features/orders/group-items"

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)

    const { page, limit, skip } = parsePagination(searchParams)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") // PENDING, CONFIRMED, etc.

    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    // Build where clause
    const where: Prisma.OrderWhereInput = {}

    // Filter by status
    if (status && status !== "all") {
      where.status = parseEnumParam(OrderStatus, status)
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        // ต้องตั้งเวลาเป็น 23:59:59.999 เพื่อให้ครอบคลุมออเดอร์ของวันนั้นทั้งหมด
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    // Search by orderNumber, customerName, customerEmail, customerPhone, customerNickname
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerNickname: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search } },
        { user: { memberTypeNote: { contains: search, mode: "insensitive" } } },
      ]
    }

    // Get stats (ทุกสถานะ)
    const [total, pending, confirmed, completed, cancelled] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "CONFIRMED" } }),
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.order.count({ where: { status: "CANCELLED" } }),
    ])

    const stats = {
      total,
      PENDING: pending,
      CONFIRMED: confirmed,
      COMPLETED: completed,
      CANCELLED: cancelled,
    }

    // Count filtered total
    const filteredTotal = await prisma.order.count({ where })

    // Get orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
            image: true,
            memberType: true,
            memberTypeNote: true,
          },
        },
        orderItems: {
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { orderItems: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })

    // Unread order notification IDs for isNew flag
    const unreadOrderNotifs = await prisma.orderNotification.findMany({
      where: { isRead: false },
      select: { orderId: true },
    })
    const unreadOrderIds = new Set(unreadOrderNotifs.map((n) => n.orderId))

    return NextResponse.json({
      orders: orders.map((order) => {
        const groupedItems = groupOrderItems(order.orderItems)
        const summary = summarizeOrderItems(groupedItems)

        const groupCount = summary.productCount
        const totalQuantity = summary.totalQuantity

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          customer: {
            id: order.user?.id || "deleted-user",
            name: order.customerName,
            nickname: order.customerNickname || order.user?.nickname || "-",
            email: order.customerEmail,
            phone: order.customerPhone,
            image: order.user?.image || null,
            memberType: order.user?.memberType || null,
            memberTypeNote: order.user?.memberTypeNote || null,
            userDeleted: order.user === null,
          },
          // จำนวน groups
          itemCount: groupCount,
          totalQuantity: totalQuantity,
          // Preview items
          previewItems: groupedItems.slice(0, 3).map((group) => {
            const pairedProducts = group.pairedItems.map((paired) => ({
              name: paired.name,
              image: paired.image,
              quantity: paired.quantity,
            }))

            return {
              productName: group.productName,
              productImage: group.productImage,
              quantity: group.mainQuantity,
              // สินค้าที่จับคู่
              pairedProducts: pairedProducts,
            }
          }),
          cancelledBy: order.cancelledBy ?? null,
          isNew: unreadOrderIds.has(order.id),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        }
      }),
      stats,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching admin orders:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 })
  }
}
