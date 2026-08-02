import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"

// GET - ดึงรายการหมวดหมู่ (รองรับ nested categories)
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1") || 1
    const limit = Math.min(parseInt(searchParams.get("limit") || "10") || 10, 100)
    const sortBy = searchParams.get("sortBy") || "sortOrder"
    const sortOrder = searchParams.get("sortOrder") || "asc"
    const flat = searchParams.get("flat") === "true"
    const status = searchParams.get("status") || ""

    // สำหรับ flat list (dropdown ใน form)
    if (flat) {
      const categories = await prisma.category.findMany({
        where: { parentId: null },
        include: {
          children: {
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      })

      return NextResponse.json({ categories })
    }

    // where clause สำหรับ PARENT
    const parentWhere: Prisma.CategoryWhereInput = {
      parentId: null, // เฉพาะ parent
    }

    if (search) {
      // ถ้ามี search: หา parent ที่ตรง OR parent ที่มี children ตรง
      parentWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        {
          children: {
            some: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
      ]
    }

    if (status === "active") {
      parentWhere.isActive = true
    } else if (status === "inactive") {
      parentWhere.isActive = false
    }

    const skip = (page - 1) * limit

    // ดึง PARENT ตาม pagination
    const [parents, totalParents] = await Promise.all([
      prisma.category.findMany({
        where: parentWhere,
        include: {
          _count: {
            select: {
              products: true,
              children: true,
            },
          },
          // ดึง children
          children: {
            include: {
              _count: {
                select: { products: true, children: true },
              },
              parent: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  sortOrder: true,
                },
              },
            },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
        orderBy: [{ sortOrder: "asc" }, { [sortBy]: sortOrder }],
        skip,
        take: limit,
      }),
      prisma.category.count({ where: parentWhere }),
    ])

    // คำนวณจำนวนสินค้ารวม children
    parents.forEach((parent) => {
      const childrenProductCount = parent.children.reduce(
        (sum, child) => sum + (child._count?.products ?? 0),
        0
      )
      ;(parent._count as any).products += childrenProductCount
    })

    // จัดเรียง parent → children
    const organizedCategories: any[] = []
    parents.forEach((parent) => {
      // เพิ่ม parent (ไม่มี parent field)
      const { children, ...parentData } = parent
      organizedCategories.push({
        ...parentData,
        parent: null,
      })

      // เพิ่ม children ทั้งหมดของ parent นี้
      children.forEach((child) => {
        organizedCategories.push(child)
      })
    })

    // นับ stats
    const [totalActive, totalInactive] = await Promise.all([
      prisma.category.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: false } }),
    ])

    const totalPages = Math.ceil(totalParents / limit)

    return NextResponse.json({
      categories: organizedCategories,
      pagination: {
        page,
        limit,
        total: totalParents, // จำนวน parent (สำหรับ pagination)
        totalPages,
      },
      stats: {
        total: totalActive + totalInactive,
        active: totalActive,
        inactive: totalInactive,
      },
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    )
  }
}

// POST - เพิ่มหมวดหมู่ใหม่ (รองรับ parentId)
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const body = await request.json()
    const { name, slug, description, isActive, parentId } = body

    // Validation
    if (!name || !slug) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อหมวดหมู่และ slug" },
        { status: 400 }
      )
    }

    // ตรวจสอบว่า slug ซ้ำหรือไม่
    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: "Slug นี้ถูกใช้งานแล้ว" },
        { status: 400 }
      )
    }

    // ตรวจสอบ parentId (ถ้ามี)
    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId },
      })

      if (!parentCategory) {
        return NextResponse.json(
          { error: "ไม่พบหมวดหมู่หลัก" },
          { status: 404 }
        )
      }

      // จำกัด 2 ระดับ - ไม่อนุญาตให้สร้าง sub-sub-category
      if (parentCategory.parentId) {
        return NextResponse.json(
          {
            error:
              "ไม่สามารถสร้างหมวดหมู่ย่อยภายใต้หมวดหมู่ย่อยได้ (จำกัด 2 ระดับ)",
          },
          { status: 400 }
        )
      }
    }

    // คำนวณ sortOrder อัตโนมัติ
    let nextSortOrder = 1

    if (parentId) {
      // หมวดย่อย: หา max sortOrder ของ children ใน parent เดียวกัน
      const maxChildSort = await prisma.category.aggregate({
        where: { parentId: parentId },
        _max: { sortOrder: true },
      })
      nextSortOrder = (maxChildSort._max.sortOrder ?? 0) + 1
    } else {
      // หมวดหลัก: หา max sortOrder ของ parent ทั้งหมด
      const maxParentSort = await prisma.category.aggregate({
        where: { parentId: null },
        _max: { sortOrder: true },
      })
      nextSortOrder = (maxParentSort._max.sortOrder ?? 0) + 1
    }

    // สร้างหมวดหมู่ใหม่
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        parentId: parentId || null,
        sortOrder: nextSortOrder,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            sortOrder: true,
          },
        },
        _count: {
          select: { products: true, children: true },
        },
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างหมวดหมู่" },
      { status: 500 }
    )
  }
}