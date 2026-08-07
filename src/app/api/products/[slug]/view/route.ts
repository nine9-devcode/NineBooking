// ไฟล์: app/api/products/[slug]/view/route.ts
// POST /api/products/[slug]/view - เพิ่ม viewCount + สร้าง ProductView record (dedup ต่อ user ต่อวัน)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // ตรวจสอบว่าสินค้ามีอยู่จริง
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existingProduct) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    // ดึง userId จาก session (ถ้ามี)
    const session = await auth()
    const userId = session?.user?.id || null

    // Dedup: เช็คว่า user นี้ดูสินค้านี้วันนี้แล้วหรือยัง
    if (userId) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const existingView = await prisma.productView.findFirst({
        where: {
          productId: existingProduct.id,
          userId,
          viewedAt: { gte: todayStart },
        },
      })

      if (existingView) {
        // ดูแล้ววันนี้ → ข้ามไม่ต้องนับซ้ำ
        return NextResponse.json({
          success: true,
          deduplicated: true,
          productId: existingProduct.id,
        })
      }
    }

    // ใช้ transaction เพื่อทำทั้ง 2 อย่างพร้อมกัน
    const result = await prisma.$transaction(async (tx) => {
      // 1. เพิ่ม viewCount += 1
      const product = await tx.product.update({
        where: { slug },
        data: {
          viewCount: {
            increment: 1,
          },
        },
        select: {
          id: true,
          name: true,
          viewCount: true,
        },
      })

      // 2. สร้าง ProductView record (สำหรับสถิติรายเดือน/รายวัน)
      await tx.productView.create({
        data: {
          productId: product.id,
          userId,
        },
      })

      return product
    })

    return NextResponse.json({
      success: true,
      viewCount: result.viewCount,
      productId: result.id,
    })
  } catch (error) {
    console.error("Error incrementing view count:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to increment view count",
      },
      { status: 500 }
    )
  }
}
