// ไฟล์: app/api/admin/dashboard/stats/route.ts
// GET /api/admin/dashboard/stats - สถิติภาพรวม

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    // วันนี้ 00:00:00
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // เมื่อวาน 00:00:00
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    // นับข้อมูลทั้งหมด
    const [
      totalMembers,
      totalProducts,
      totalCategories,
      totalOrders,
      pendingOrders,
      todayOrders,
      yesterdayOrders,
      totalViews,
      todayViews,
      yesterdayViews,
      openIssues,
    ] = await Promise.all([
      // 1. สมาชิกทั้งหมด (ไม่รวม Admin)
      prisma.user.count({
        where: { role: "user" },
      }),

      // 2. สินค้าทั้งหมด (active)
      prisma.product.count({
        where: { isActive: true },
      }),

      // 3. หมวดหมู่ทั้งหมด (active)
      prisma.category.count({
        where: { isActive: true },
      }),

      // 4. คำสั่งจองทั้งหมด
      prisma.order.count(),

      // 5. รอดำเนินการ (PENDING)
      prisma.order.count({
        where: { status: "PENDING" },
      }),

      // 6. คำสั่งจองวันนี้
      prisma.order.count({
        where: {
          createdAt: { gte: todayStart },
        },
      }),

      // 7. คำสั่งจองเมื่อวาน (สำหรับ trend)
      prisma.order.count({
        where: {
          createdAt: {
            gte: yesterdayStart,
            lt: todayStart,
          },
        },
      }),

      // 8. ยอดเข้าชมทั้งหมด (จาก ProductView)
      prisma.product
        .aggregate({
          _sum: { viewCount: true },
          where: { isActive: true }, // (Optional: นับเฉพาะสินค้าที่ขายอยู่)
        })
        .then((res) => res._sum.viewCount || 0),

      // 9. ยอดเข้าชมวันนี้ (จาก ProductView)
      prisma.productView.count({
        where: {
          viewedAt: { gte: todayStart },
        },
      }),

      // 10. ยอดเข้าชมเมื่อวาน (สำหรับ trend)
      prisma.productView.count({
        where: {
          viewedAt: {
            gte: yesterdayStart,
            lt: todayStart,
          },
        },
      }),

      // 11. ปัญหาที่ยังเปิดอยู่ (PENDING + IN_PROGRESS)
      prisma.contactIssue.count({
        where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
      }),
    ])

    // คำนวณ trend (เปลี่ยนแปลงจากเมื่อวาน)
    const orderTrend =
      yesterdayOrders > 0
        ? Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100)
        : todayOrders > 0
          ? 100
          : 0

    const viewTrend =
      yesterdayViews > 0
        ? Math.round(((todayViews - yesterdayViews) / yesterdayViews) * 100)
        : todayViews > 0
          ? 100
          : 0

    return NextResponse.json({
      totalMembers,
      totalProducts,
      totalCategories,
      totalOrders,
      pendingOrders,
      todayOrders,
      totalViews,
      todayViews,
      openIssues,
      // Trends
      orderTrend,
      viewTrend,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
