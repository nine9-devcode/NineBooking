import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"

// GET - ดึง pairings ของ category
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

    // ถ้าระบุ categoryId → ดึง pairings ของ category นั้น
    if (categoryId) {
      const pairings = await prisma.categoryPairing.findMany({
        where: {
          OR: [
            { categoryAId: categoryId },
            { categoryBId: categoryId },
          ],
        },
        include: {
          categoryA: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          categoryB: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      // แปลงให้เป็น paired categories (ไม่รวมตัวเอง)
      const pairedCategories = pairings.map((pairing) => {
        const pairedCategory =
          pairing.categoryAId === categoryId
            ? pairing.categoryB
            : pairing.categoryA
        return {
          pairingId: pairing.id,
          category: pairedCategory,
          createdAt: pairing.createdAt,
        }
      })

      return NextResponse.json({ pairings: pairedCategories })
    }

    // ถ้าไม่ระบุ → ดึงทั้งหมด
    const allPairings = await prisma.categoryPairing.findMany({
      include: {
        categoryA: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        categoryB: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ pairings: allPairings })
  } catch (error) {
    console.error("Error fetching category pairings:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    )
  }
}

// POST - เพิ่ม pairing ใหม่
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const body = await request.json()
    const { categoryAId, categoryBId } = body

    // Validation
    if (!categoryAId || !categoryBId) {
      return NextResponse.json(
        { error: "กรุณาเลือกหมวดหมู่ทั้งสองฝั่ง" },
        { status: 400 }
      )
    }

    // ไม่อนุญาตให้จับคู่ตัวเอง
    if (categoryAId === categoryBId) {
      return NextResponse.json(
        { error: "ไม่สามารถจับคู่หมวดหมู่เดียวกันได้" },
        { status: 400 }
      )
    }

    // ตรวจสอบว่า categories มีอยู่จริง
    const [categoryA, categoryB] = await Promise.all([
      prisma.category.findUnique({ where: { id: categoryAId } }),
      prisma.category.findUnique({ where: { id: categoryBId } }),
    ])

    if (!categoryA || !categoryB) {
      return NextResponse.json(
        { error: "ไม่พบหมวดหมู่ที่เลือก" },
        { status: 404 }
      )
    }

    // ตรวจสอบว่ามี pairing อยู่แล้วหรือไม่ (Two-way check)
    const existingPairing = await prisma.categoryPairing.findFirst({
      where: {
        OR: [
          { categoryAId, categoryBId },
          { categoryAId: categoryBId, categoryBId: categoryAId },
        ],
      },
    })

    if (existingPairing) {
      return NextResponse.json(
        { error: "หมวดหมู่นี้ถูกจับคู่กันแล้ว" },
        { status: 400 }
      )
    }

    // สร้าง pairing ใหม่
    const pairing = await prisma.categoryPairing.create({
      data: {
        categoryAId,
        categoryBId,
      },
      include: {
        categoryA: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        categoryB: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json(pairing, { status: 201 })
  } catch (error) {
    console.error("Error creating category pairing:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างการจับคู่" },
      { status: 500 }
    )
  }
}