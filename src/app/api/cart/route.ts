import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

// Schema สำหรับเพิ่มสินค้าลง cart
const addToCartSchema = z.object({
  productId: z.string().min(1, "กรุณาระบุสินค้า"),
  quantity: z.number().int().positive().max(99, "จำนวนสูงสุดคือ 99 ชิ้น").default(1),
  pairedProductId: z.string().nullable().optional(),
})

// GET - ดึง cart ของ user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 })
    }

    const userId = session.user.id

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            subtitle: true,
            slug: true,
            image: true,
            isActive: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        pairedProduct: {
          select: {
            id: true,
            name: true,
            subtitle: true,
            slug: true,
            image: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // นับจำนวนรวม
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({
      items: cartItems,
      totalItems,
      count: cartItems.length,
    })
  } catch (error) {
    console.error("Error fetching cart:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลตะกร้า" }, { status: 500 })
  }
}

// POST - เพิ่มสินค้าลง cart
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    // Validate input
    const validationResult = addToCartSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { productId, quantity, pairedProductId } = validationResult.data

    // ตรวจสอบว่าสินค้ามีอยู่จริงและ active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true, name: true },
    })

    if (!product) {
      return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 })
    }

    if (!product.isActive) {
      return NextResponse.json({ error: "สินค้านี้ไม่พร้อมให้จองในขณะนี้" }, { status: 400 })
    }

    // ตรวจสอบ paired product (ถ้ามี)
    if (pairedProductId) {
      const pairedProduct = await prisma.product.findUnique({
        where: { id: pairedProductId },
        select: { id: true, isActive: true },
      })

      if (!pairedProduct || !pairedProduct.isActive) {
        return NextResponse.json({ error: "สินค้าที่จับคู่ไม่พร้อมใช้งาน" }, { status: 400 })
      }
    }

    // ตรวจสอบว่ามี combination นี้ใน cart แล้วหรือไม่
    // ใช้ unique constraint: userId + productId + pairedProductId
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        userId,
        productId,
        pairedProductId: pairedProductId ?? null,
      },
    })

    let cartItem

    if (existingCartItem) {
      // มี combination เดิม → อัพเดท quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: Math.min(existingCartItem.quantity + quantity, 99),
        },
        include: {
          product: {
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
                },
              },
            },
          },
          pairedProduct: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      })
    } else {
      // ยังไม่มี → สร้างใหม่
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
          pairedProductId: pairedProductId ?? null,
        },
        include: {
          product: {
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
                },
              },
            },
          },
          pairedProduct: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      })
    }

    // นับจำนวนรวมใน cart
    const totalItems = await prisma.cartItem.aggregate({
      where: { userId },
      _sum: { quantity: true },
    })

    return NextResponse.json(
      {
        cartItem,
        totalItems: totalItems._sum.quantity || 0,
        message: existingCartItem ? "อัพเดทตะกร้าแล้ว" : "เพิ่มลงตะกร้าแล้ว",
      },
      { status: existingCartItem ? 200 : 201 }
    )
  } catch (error) {
    console.error("Error adding to cart:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเพิ่มสินค้า" }, { status: 500 })
  }
}

// DELETE - ล้าง cart ทั้งหมด
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 })
    }

    const userId = session.user.id

    await prisma.cartItem.deleteMany({
      where: { userId },
    })

    return NextResponse.json({
      message: "ล้างตะกร้าเรียบร้อยแล้ว",
    })
  } catch (error) {
    console.error("Error clearing cart:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการล้างตะกร้า" }, { status: 500 })
  }
}
