import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { requireAdmin } from "@/lib/api/guards"
import { parsePagination, parseSort } from "@/lib/api/query"
import { prisma } from "@/lib/db"
import { AUDIT_ACTIONS, recordAuditSafely } from "@/lib/audit"
import { clientIp } from "@/lib/rate-limit"
import { sanitizeRichText } from "@/lib/sanitize"

// ฟิลด์ที่ยอมให้เรียงได้ — ของเดิมยัดค่าจาก query string เข้า orderBy ตรงๆ
// ?sortBy=nope จึงกลายเป็น 500 จาก Prisma
const SORTABLE_FIELDS = ["createdAt", "updatedAt", "name", "viewCount"] as const

// GET - ดึงรายการสินค้า
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const { page, limit, skip } = parsePagination(searchParams)
    const categoryId = searchParams.get("categoryId") || ""
    const excludeId = searchParams.get("excludeId") || ""
    const status = searchParams.get("status") || "" // "active", "inactive", ""
    const sort = parseSort(searchParams, SORTABLE_FIELDS, "createdAt")

    // Build where clause
    const where: Prisma.ProductWhereInput = {}

    // Search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { slug: { contains: search, mode: "insensitive" as const } },
        { subtitle: { contains: search, mode: "insensitive" as const } },
      ]
    }

    // Filter by category
    if (categoryId) {
      // ดึง ID ของหมวดหมู่ลูกทั้งหมดมาด้วย
      const subCategories = await prisma.category.findMany({
        where: { parentId: categoryId },
        select: { id: true },
      })

      const categoryIds = [categoryId, ...subCategories.map((c) => c.id)]

      // เปลี่ยนมาใช้ { in: ... } เพื่อให้นับรวมสินค้าในหมวดลูกทั้งหมด
      where.categoryId = { in: categoryIds }
    }

    // Exclude specific product (สำหรับ Exclusive Pairing Modal)
    if (excludeId) {
      where.id = { not: excludeId }
    }

    // บันทึก baseWhere ก่อน apply status filter (สำหรับ stats ที่ต้องนับทั้งหมด)
    const baseWhere = { ...where }

    // Filter by status
    if (status === "active") {
      where.isActive = true
    } else if (status === "inactive") {
      where.isActive = false
    }

    // ดึง products, total, stats
    const [products, total, totalActive, totalInactive] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
              exclusivePairingsA: true,
              exclusivePairingsB: true,
            },
          },
        },
        orderBy: { [sort.field]: sort.direction },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
      // นับสินค้าที่เปิดใช้งาน (ใช้ baseWhere ไม่รวม status filter)
      prisma.product.count({
        where: { ...baseWhere, isActive: true },
      }),
      // นับสินค้าที่ปิดใช้งาน (ใช้ baseWhere ไม่รวม status filter)
      prisma.product.count({
        where: { ...baseWhere, isActive: false },
      }),
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
      // stats จาก database
      stats: {
        total: totalActive + totalInactive,
        active: totalActive,
        inactive: totalInactive,
      },
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 })
  }
}

// POST - เพิ่มสินค้าใหม่
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const body = await request.json()
    const {
      name,
      subtitle,
      slug,
      description,
      image,
      images,
      datasheets,
      categoryId,
      isActive,
    } = body

    // Validation
    if (!name || !slug || !categoryId || !description || !image) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, slug, หมวดหมู่, รายละเอียด, รูปหลัก)" },
        { status: 400 }
      )
    }

    // ตรวจสอบว่า slug ซ้ำหรือไม่
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    })

    if (existingProduct) {
      return NextResponse.json({ error: "Slug นี้ถูกใช้งานแล้ว" }, { status: 400 })
    }

    // ตรวจสอบว่าหมวดหมู่มีอยู่จริง
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json({ error: "ไม่พบหมวดหมู่ที่เลือก" }, { status: 400 })
    }

    // สร้างสินค้าใหม่
    const product = await prisma.product.create({
      data: {
        name,
        subtitle: subtitle || null,
        slug,
        description: sanitizeRichText(description),
        image,
        images: images || [],
        datasheets: datasheets || null,
        categoryId,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        category: true,
      },
    })

    await recordAuditSafely({
      actorId: guard.user.id,
      action: AUDIT_ACTIONS.PRODUCT_CREATED,
      entityType: "Product",
      entityId: product.id,
      after: { name: product.name, slug: product.slug },
      ip: clientIp(request.headers),
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างสินค้า" }, { status: 500 })
  }
}
