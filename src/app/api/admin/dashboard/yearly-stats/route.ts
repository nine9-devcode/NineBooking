import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())

    const monthsShort = [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ]

    // เตรียม Array 12 ช่อง (เริ่มที่ 0)
    const orders = Array(12).fill(0)
    const views = Array(12).fill(0)

    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year + 1, 0, 1)

    // -------------------------------------------------------
    // 1. ดึงข้อมูล ORDERS (ดึงรวดเดียว ไม่ต้องวนลูป)
    // -------------------------------------------------------
    const ordersData = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
      select: { createdAt: true },
    })

    // แจกแจง order ลงแต่ละเดือน
    ordersData.forEach((order) => {
      const month = order.createdAt.getMonth()
      orders[month]++
    })

    // -------------------------------------------------------
    // 2. ดึงข้อมูล VIEWS (ระบบ Hybrid: Summary + Live)
    // -------------------------------------------------------

    // 2.1 ดึงจากตารางสรุป (Summary) - สำหรับข้อมูลอดีต
    const historicalViews = await prisma.productViewSummary.groupBy({
      by: ["date"],
      where: {
        date: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
      _sum: { viewCount: true },
    })

    // ใส่ข้อมูลจาก Summary ลงกราฟ
    historicalViews.forEach((record) => {
      const date = new Date(record.date)
      const month = date.getMonth()
      views[month] += record._sum.viewCount || 0
    })

    // 2.2 ถ้าเป็นปีปัจจุบัน -> ต้องบวกยอด "สด" ของวันนี้จาก ProductView (ส่วนที่ยังไม่ Archive)
    const currentYear = new Date().getFullYear()
    if (year === currentYear) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const liveViews = await prisma.productView.count({
        where: {
          viewedAt: { gte: todayStart },
        },
      })

      const currentMonth = todayStart.getMonth()
      views[currentMonth] += liveViews
    }

    // -------------------------------------------------------
    // 3. คำนวณยอดรวมและข้อมูลอื่นๆ
    // -------------------------------------------------------
    const totalOrders = orders.reduce((a, b) => a + b, 0)
    const totalViews = views.reduce((a, b) => a + b, 0)

    // หาปีเก่าสุดที่มีข้อมูล (Available Years)
    const oldestOrder = await prisma.order.findFirst({
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    })

    // ใช้ ProductViewSummary หาปีเก่าสุด
    const oldestSummary = await prisma.productViewSummary.findFirst({
      orderBy: { date: "asc" },
      select: { date: true },
    })

    let startYear = currentYear
    if (oldestOrder?.createdAt)
      startYear = Math.min(startYear, oldestOrder.createdAt.getFullYear())
    if (oldestSummary?.date) startYear = Math.min(startYear, oldestSummary.date.getFullYear())

    const availableYears: number[] = []
    for (let y = startYear; y <= currentYear; y++) {
      availableYears.push(y)
    }

    return NextResponse.json({
      year,
      months: monthsShort,
      orders,
      views,
      totalOrders,
      totalViews,
      availableYears,
    })
  } catch (error) {
    console.error("Error fetching yearly stats:", error)
    return NextResponse.json({ error: "Failed to fetch yearly stats" }, { status: 500 })
  }
}
