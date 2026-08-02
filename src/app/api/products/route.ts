import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET - ดึงสินค้าที่ active (สำหรับ Customer)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const categorySlug = searchParams.get("categorySlug") || ""
    const sort = searchParams.get("sort") || "category"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 100)

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      isActive: true,
    }

    // Search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { subtitle: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Variable เก็บข้อมูล category
    let categoryInfo: { id: string; name: string; slug: string } | null = null

    // Filter by category slug
    if (categorySlug) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
        include: { children: { select: { id: true } } },
      })

      if (category) {
        const categoryIds = [
          category.id,
          ...category.children.map((c) => c.id),
        ]
        where.categoryId = { in: categoryIds }
        
        categoryInfo = {
          id: category.id,
          name: category.name,
          slug: category.slug,
        }
      }
    }
    // Filter by category ID
    else if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { children: { select: { id: true } } },
      })

      if (category) {
        const categoryIds = [
          categoryId,
          ...category.children.map((c) => c.id),
        ]
        where.categoryId = { in: categoryIds }
        
        categoryInfo = {
          id: category.id,
          name: category.name,
          slug: category.slug,
        }
      }
    }

    // จัดเรียงตามพารามิเตอร์
    let orderBy: any[]

    switch (sort) {
      case "category":
        // เรียงตาม parent.sortOrder → category.sortOrder → createdAt
        orderBy = [
          { category: { parent: { sortOrder: "asc" } } },
          { category: { sortOrder: "asc" } },
          { createdAt: "desc" },
        ]
        break
      case "newest":
        orderBy = [{ createdAt: "desc" }]
        break
      case "oldest":
        orderBy = [{ createdAt: "asc" }]
        break
      case "name-asc":
        orderBy = [{ name: "asc" }]
        break
      case "name-desc":
        orderBy = [{ name: "desc" }]
        break
      case "popular":
        orderBy = [{ viewCount: "desc" }, { createdAt: "desc" }]
        break
      default:
        // default = category
        orderBy = [
          { category: { parent: { sortOrder: "asc" } } },
          { category: { sortOrder: "asc" } },
          { createdAt: "desc" },
        ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              sortOrder: true,
              parent: {
                select: {
                  sortOrder: true,
                }
              }
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      categoryInfo,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" },
      { status: 500 }
    )
  }
}