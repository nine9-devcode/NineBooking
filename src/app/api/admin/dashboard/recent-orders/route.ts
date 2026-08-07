// ไฟล์: app/api/admin/dashboard/recent-orders/route.ts
// GET /api/admin/dashboard/recent-orders?limit=5

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 10) // Max 10

    const recentOrders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            nickname: true,
            email: true,
            image: true,
          },
        },
        orderItems: {
          select: {
            quantity: true,
          },
        },
      },
    })

    const formatted = recentOrders.map((order) => {
      // นับจำนวนสินค้าทั้งหมด
      const totalItems = order.orderItems.reduce((sum, item) => sum + item.quantity, 0)

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        totalItems,
        customer: {
          name: order.user?.name || order.customerName,
          nickname: order.user?.nickname || order.customerNickname,
          email: order.user?.email || order.customerEmail,
          image: order.user?.image,
        },
      }
    })

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Error fetching recent orders:", error)
    return NextResponse.json({ error: "Failed to fetch recent orders" }, { status: 500 })
  }
}
