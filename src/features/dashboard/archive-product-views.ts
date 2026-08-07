import { prisma } from "@/lib/db"

export async function archiveProductViews() {
  try {
    console.log("Starting ProductView archiving...")

    const now = new Date()
    const thaiTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    thaiTime.setUTCHours(0, 0, 0, 0)
    const cutoffTime = new Date(thaiTime.getTime() - 7 * 60 * 60 * 1000)

    // 1. ดึงข้อมูลที่ "ตกค้าง" ทั้งหมด (เก่ากว่าวันนี้ และยังไม่ processed)
    // เราดึง id, productId, viewedAt มาเพื่อมาจัดกลุ่มเองใน JS
    const unprocessedViews = await prisma.productView.findMany({
      where: {
        viewedAt: { lt: cutoffTime },
        processed: false,
      },
      select: {
        id: true,
        productId: true,
        viewedAt: true,
      },
    })

    if (unprocessedViews.length === 0) {
      console.log("No pending views to archive")
      return { success: true, count: 0 }
    }

    console.log(`Found ${unprocessedViews.length} views to archive`)

    // 2. จัดกลุ่มข้อมูลใน Memory (Map: "productId_dateString" -> count)
    const summaryMap = new Map<string, { productId: string; date: Date; count: number }>()

    for (const view of unprocessedViews) {
      const date = new Date(view.viewedAt)
      date.setUTCHours(0, 0, 0, 0) // ตัดเวลาทิ้งเหลือแต่วันที่

      const key = `${view.productId}_${date.toISOString()}`

      if (!summaryMap.has(key)) {
        summaryMap.set(key, { productId: view.productId, date, count: 0 })
      }
      summaryMap.get(key)!.count++
    }

    // 3. Upsert ลง Summary (แยกตามวันและสินค้า)
    await prisma.$transaction(
      Array.from(summaryMap.values()).map((item) =>
        prisma.productViewSummary.upsert({
          where: {
            productId_date: {
              productId: item.productId,
              date: item.date,
            },
          },
          create: {
            productId: item.productId,
            date: item.date,
            viewCount: item.count,
          },
          update: {
            viewCount: { increment: item.count },
          },
        })
      )
    )

    // 4. Mark processed (ทีเดียวทั้งหมด)
    await prisma.productView.updateMany({
      where: {
        id: { in: unprocessedViews.map((v) => v.id) },
      },
      data: { processed: true },
    })

    // 5. Cleanup (ลบของเก่าเกิน 30 วัน)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30)

    await prisma.productView.deleteMany({
      where: {
        viewedAt: { lt: thirtyDaysAgo },
        processed: true,
      },
    })

    console.log("Archiving completed successfully")
    return { success: true, processed: unprocessedViews.length }
  } catch (error) {
    console.error("Archiving failed:", error)
    throw error
  }
}
