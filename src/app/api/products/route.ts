import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { auth } from "@/lib/auth"
import { parsePagination } from "@/lib/api/query"
import { prisma } from "@/lib/db"
import {
  searchProductIds,
  shouldUseFullText,
} from "@/features/products/services/search-products"

// GET - ดึงสินค้าที่ active (สำหรับ Customer)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const categorySlug = searchParams.get("categorySlug") || ""
    const sort = searchParams.get("sort") || "category"
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 12 })

    // ใช้ type ของ Prisma แทน any — ตรงนี้คือจุดที่ input จากผู้ใช้เข้าไปถึง query
    const where: Prisma.ProductWhereInput = {
      isActive: true,
    }

    // คำค้นสั้นมากใช้ ILIKE ตามเดิม — full-text ทำงานผ่าน searchProductIds ด้านล่าง
    const useFullText = Boolean(search) && shouldUseFullText(search)

    if (search && !useFullText) {
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
        const categoryIds = [category.id, ...category.children.map((c) => c.id)]
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
        const categoryIds = [categoryId, ...category.children.map((c) => c.id)]
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

    // ── ค้นด้วย full-text: หา id ที่เกี่ยวข้องก่อน แล้วดึงรายละเอียดตามปกติ ──
    if (useFullText) {
      const categoryIds =
        where.categoryId && typeof where.categoryId === "object" && "in" in where.categoryId
          ? (where.categoryId.in as string[])
          : undefined

      const { hits, total: matchCount } = await searchProductIds({
        query: search,
        categoryIds,
        limit,
        skip,
      })

      const found = await prisma.product.findMany({
        where: { id: { in: hits.map((hit) => hit.id) } },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              sortOrder: true,
              parent: { select: { sortOrder: true } },
            },
          },
        },
      })

      // findMany ไม่รักษาลำดับของ id ที่ส่งเข้าไป ต้องเรียงตามคะแนนเอง
      const byId = new Map(found.map((product) => [product.id, product]))
      const ranked = hits.map((hit) => byId.get(hit.id)).filter(Boolean)

      return NextResponse.json({
        products: ranked,
        pagination: {
          page,
          limit,
          total: matchCount,
          totalPages: Math.ceil(matchCount / limit),
        },
        categoryInfo,
      })
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
                },
              },
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
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" }, { status: 500 })
  }
}
