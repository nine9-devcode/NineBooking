import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"

// GET - ดึง Exclusive Pairings ของสินค้า
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json(
        { error: "กรุณาระบุ productId" },
        { status: 400 }
      )
    }

    // ดึง Exclusive Pairings ทั้ง 2 ทาง
    const pairings = await prisma.exclusivePairing.findMany({
      where: {
        OR: [
          { productAId: productId },
          { productBId: productId },
        ],
      },
      include: {
        productA: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        productB: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // แปลงให้ส่งเฉพาะสินค้าคู่ (ไม่ใช่ตัวเอง)
    const pairedProducts = pairings.map((pairing) => {
      const pairedProduct = pairing.productAId === productId
        ? pairing.productB
        : pairing.productA

      return {
        pairingId: pairing.id,
        ...pairedProduct,
      }
    })

    // ดึง showCategoryPairings จาก product
    const productData = await prisma.product.findUnique({
      where: { id: productId },
      select: { showCategoryPairings: true },
    })

    return NextResponse.json({
      pairings: pairedProducts,
      count: pairedProducts.length,
      showCategoryPairings: productData?.showCategoryPairings ?? false,
    })
  } catch (error) {
    console.error("Error fetching exclusive pairings:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    )
  }
}

// POST - สร้าง Exclusive Pairing
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const body = await request.json()
    const { productAId, productBId } = body

    if (!productAId || !productBId) {
      return NextResponse.json(
        { error: "กรุณาระบุสินค้าทั้ง 2 ตัว" },
        { status: 400 }
      )
    }

    if (productAId === productBId) {
      return NextResponse.json(
        { error: "ไม่สามารถจับคู่สินค้ากับตัวเองได้" },
        { status: 400 }
      )
    }

    // เรียงลำดับ ID เพื่อป้องกันการสร้างซ้ำ (A-B กับ B-A)
    const [sortedA, sortedB] = [productAId, productBId].sort()

    // เช็คว่ามี pairing นี้อยู่แล้วหรือไม่
    const existing = await prisma.exclusivePairing.findFirst({
      where: {
        OR: [
          { productAId: sortedA, productBId: sortedB },
          { productAId: sortedB, productBId: sortedA },
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "สินค้าคู่นี้ถูกจับคู่ไว้แล้ว" },
        { status: 400 }
      )
    }

    // สร้าง Exclusive Pairing
    const pairing = await prisma.exclusivePairing.create({
      data: {
        productAId: sortedA,
        productBId: sortedB,
      },
      include: {
        productA: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
          },
        },
        productB: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
          },
        },
      },
    })

    return NextResponse.json({
      message: "จับคู่สินค้าเฉพาะสำเร็จ",
      pairing,
    })
  } catch (error) {
    console.error("Error creating exclusive pairing:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างการจับคู่" },
      { status: 500 }
    )
  }
}