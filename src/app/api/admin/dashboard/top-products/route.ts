// ไฟล์: app/api/admin/dashboard/top-products/route.ts
// GET /api/admin/dashboard/top-products

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    // ดึง OrderItems ทั้งหมด
    const orderItems = await prisma.orderItem.findMany({
      select: {
        orderId: true,
        productId: true,
        quantity: true,
        pairedProductId: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        pairedProduct: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    // สร้าง map สำหรับนับ
    // key: productId
    // value: { orderIds: Set<orderId>, totalQuantity: number, productInfo }
    const productStats: Record<
      string,
      {
        product: {
          id: string
          name: string
          slug: string
          image: string | null
          categoryName: string
        }
        orderIds: Set<string>
        totalQuantity: number
      }
    > = {}

    orderItems.forEach((item) => {
      // สินค้าที่ถูกลบไปแล้วไม่นับ — อันดับนี้ต้องลิงก์ไปหน้าสินค้าได้
      if (!item.productId || !item.product) return

      const mainProductId = item.productId

      if (!productStats[mainProductId]) {
        productStats[mainProductId] = {
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            image: item.product.image,
            categoryName: item.product.category.name,
          },
          orderIds: new Set(),
          totalQuantity: 0,
        }
      }

      // เพิ่ม orderId
      productStats[mainProductId].orderIds.add(item.orderId)
      // เพิ่มจำนวนชิ้น
      productStats[mainProductId].totalQuantity += item.quantity

      // 2. นับ Paired Product (ถ้ามี)
      if (item.pairedProductId && item.pairedProduct) {
        const pairedProductId = item.pairedProductId

        if (!productStats[pairedProductId]) {
          productStats[pairedProductId] = {
            product: {
              id: item.pairedProduct.id,
              name: item.pairedProduct.name,
              slug: item.pairedProduct.slug,
              image: item.pairedProduct.image,
              categoryName: item.pairedProduct.category.name,
            },
            orderIds: new Set(),
            totalQuantity: 0,
          }
        }

        // เพิ่ม orderId (Paired ก็นับ Order เดียวกัน)
        productStats[pairedProductId].orderIds.add(item.orderId)
        // เพิ่มจำนวนชิ้น (Paired มี quantity = 1 ต่อ item)
        productStats[pairedProductId].totalQuantity += 1
      }
    })

    // แปลงเป็น array และเรียงลำดับตามจำนวน Order
    const topByOrders = Object.values(productStats)
      .map((stat) => ({
        id: stat.product.id,
        name: stat.product.name,
        slug: stat.product.slug,
        image: stat.product.image,
        categoryName: stat.product.categoryName,
        orderCount: stat.orderIds.size, // จำนวน Order ที่มีสินค้านี้
        totalQuantity: stat.totalQuantity, // จำนวนชิ้นรวม
      }))
      .filter((p) => p.orderCount > 0)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5)

    // Top 5 สินค้าที่มียอดเข้าชมมากที่สุด
    const topByViews = await prisma.product.findMany({
      where: {
        isActive: true,
        viewCount: { gt: 0 },
      },
      orderBy: {
        viewCount: "desc",
      },
      take: 5,
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    })

    const topViewsFormatted = topByViews.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      categoryName: product.category.name,
      viewCount: product.viewCount,
    }))

    return NextResponse.json({
      topByOrders,
      topByViews: topViewsFormatted,
    })
  } catch (error) {
    console.error("Error fetching top products:", error)
    return NextResponse.json({ error: "Failed to fetch top products" }, { status: 500 })
  }
}
