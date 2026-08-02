import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET - ดึงรายละเอียดสินค้า
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const product = await prisma.product.findUnique({
      where: { 
        slug,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        subtitle: true,
        slug: true,
        description: true,
        image: true,
        images: true,
        datasheets: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: "ไม่พบสินค้า" },
        { status: 404 }
      )
    }

    // ดึงสินค้าที่เกี่ยวข้อง (หมวดหมู่เดียวกัน)
    const relatedProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.categoryId,
        id: { not: product.id }, // ไม่รวมตัวเอง
      },
      select: {
        id: true,
        name: true,
        subtitle: true,
        slug: true,
        image: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      product,
      relatedProducts,
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" },
      { status: 500 }
    )
  }
}