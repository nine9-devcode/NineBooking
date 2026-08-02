import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET - ดึงหมวดหมู่ที่ active (สำหรับ Customer)
export async function GET(request: NextRequest) {
  try {
    // ดึง parent categories ที่ active
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null, // เฉพาะ parent
      },
      include: {
        children: {
          where: { isActive: true },
          include: {
            _count: {
              select: { products: { where: { isActive: true } } },
            },
          },
          // เรียงหมวดย่อยตาม sortOrder
          orderBy: [
            { sortOrder: "asc" },
            { name: "asc" },
          ],
        },
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      // เรียงหมวดหลักตาม sortOrder
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    })

    // คำนวณจำนวนสินค้ารวม children
    categories.forEach((parent) => {
      const childrenProductCount = parent.children.reduce(
        (sum, child) => sum + (child._count?.products ?? 0),
        0
      )
      ;(parent._count as any).products += childrenProductCount
    })

    // นับจำนวนสินค้าทั้งหมด
    const totalProducts = await prisma.product.count({
      where: { isActive: true },
    })

    return NextResponse.json({
      categories,
      totalProducts,
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่" },
      { status: 500 }
    )
  }
}