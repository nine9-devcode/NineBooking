import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET - ดึงสินค้าที่จับคู่กับสินค้าปัจจุบัน
// ลำดับการเช็ค:
//   1. ถ้ามี Exclusive (จับคู่สินค้าตรง) + ปิด switch  → แสดงเฉพาะสินค้าที่จับคู่ตรง
//   2. ถ้ามี Exclusive + เปิด switch                    → รวมสินค้าจับคู่ตรง + สินค้าจากหมวดที่จับคู่
//   3. ถ้าไม่มี Exclusive เลย                           → แสดงสินค้าทั้งหมดจากหมวดที่จับคู่
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // หาสินค้าปัจจุบัน พร้อมเช็คว่าเปิด switch "แสดงสินค้าจากหมวดที่จับคู่ด้วย" ไหม
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      select: {
        id: true,
        categoryId: true,
        showCategoryPairings: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 })
    }

    // ========================================
    // 1. เช็คว่าสินค้านี้มีการจับคู่เฉพาะ (Exclusive) หรือไม่
    //    เช่น "จอ A" จับคู่ตรงกับ "เครื่องอ่าน X", "เครื่องอ่าน Y"
    // ========================================
    const exclusivePairings = await prisma.exclusivePairing.findMany({
      where: {
        OR: [{ productAId: product.id }, { productBId: product.id }],
      },
      include: {
        productA: {
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
        productB: {
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
      },
    })

    // ถ้ามี Exclusive Pairing → เข้า กรณี 1 หรือ 2
    if (exclusivePairings.length > 0) {
      // ดึงเฉพาะสินค้าคู่ (ไม่เอาตัวเอง) และเอาเฉพาะที่ยัง active อยู่
      const exclusiveProducts = exclusivePairings
        .map((pairing) =>
          pairing.productAId === product.id ? pairing.productB : pairing.productA
        )
        .filter((p) => p.isActive)

      // กรณี 1: ปิด switch → ส่งเฉพาะสินค้าที่จับคู่ตรงเท่านั้น
      if (!product.showCategoryPairings) {
        const exclusiveCategories = [
          ...new Map(exclusiveProducts.map((p) => [p.category.id, p.category])).values(),
        ]
        return NextResponse.json({
          isExclusive: true,
          pairedCategories: exclusiveCategories,
          pairedProducts: exclusiveProducts,
        })
      }

      // กรณี 2: เปิด switch → รวมสินค้าจับคู่ตรง + สินค้าจากหมวดที่จับคู่เข้าด้วยกัน
      // หาหมวดที่จับคู่กับหมวดของสินค้านี้
      const categoryPairings = await prisma.categoryPairing.findMany({
        where: {
          OR: [{ categoryAId: product.categoryId }, { categoryBId: product.categoryId }],
        },
        select: {
          categoryAId: true,
          categoryBId: true,
          categoryA: { select: { id: true, name: true, slug: true } },
          categoryB: { select: { id: true, name: true, slug: true } },
        },
      })

      // แปลงให้ได้หมวดฝั่งตรงข้าม (ไม่เอาหมวดตัวเอง)
      const pairedCategories = categoryPairings.map((p) =>
        p.categoryAId === product.categoryId ? p.categoryB : p.categoryA
      )

      // ดึงสินค้าจากหมวดที่จับคู่ แต่ข้ามสินค้าที่มี exclusive ของตัวเอง
      // เพราะสินค้าที่มี exclusive จะจับคู่เฉพาะตามที่กำหนดไว้ ไม่ควรโผล่ในคู่ของคนอื่น
      const categoryProductsArrays = await Promise.all(
        pairedCategories.map((cat) =>
          prisma.product.findMany({
            where: {
              categoryId: cat.id,
              isActive: true,
              AND: [{ exclusivePairingsA: { none: {} } }, { exclusivePairingsB: { none: {} } }],
            },
            select: {
              id: true,
              name: true,
              subtitle: true,
              slug: true,
              image: true,
              category: { select: { id: true, name: true, slug: true } },
            },
            orderBy: { createdAt: "desc" },
          })
        )
      )

      const categoryProducts = categoryProductsArrays.flat()

      // รวมสินค้าจาก exclusive + category เข้าด้วยกัน แล้วตัดตัวซ้ำออก
      const allProductsMap = new Map<string, any>()
      for (const p of [...exclusiveProducts, ...categoryProducts]) {
        if (!allProductsMap.has(p.id)) allProductsMap.set(p.id, p)
      }
      const allProducts = Array.from(allProductsMap.values())

      // รวมหมวดจากสินค้าทั้งหมดที่ได้ (ใช้แสดง tab หมวดในหน้าบ้าน)
      const allCategoriesMap = new Map<string, any>()
      for (const p of allProducts) {
        if (!allCategoriesMap.has(p.category.id)) {
          allCategoriesMap.set(p.category.id, p.category)
        }
      }

      return NextResponse.json({
        isExclusive: false,
        pairedCategories: Array.from(allCategoriesMap.values()),
        pairedProducts: allProducts,
      })
    }

    // ========================================
    // กรณี 3: ไม่มี Exclusive เลย → ใช้ Category Pairing อย่างเดียว
    //   เช่น หมวด "จอมอนิเตอร์" จับคู่กับหมวด "เครื่องอ่านบัตร"
    //   → แสดงสินค้าทั้งหมดในหมวด "เครื่องอ่านบัตร"
    // ========================================

    // หาหมวดที่จับคู่กับหมวดของสินค้านี้
    const categoryPairings = await prisma.categoryPairing.findMany({
      where: {
        OR: [{ categoryAId: product.categoryId }, { categoryBId: product.categoryId }],
      },
      select: {
        categoryAId: true,
        categoryBId: true,
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

    // ถ้าไม่มีหมวดไหนจับคู่เลย → ไม่มีสินค้าจะแสดง
    if (categoryPairings.length === 0) {
      return NextResponse.json({
        isExclusive: false,
        pairedCategories: [],
        pairedProducts: [],
      })
    }

    // แปลงให้ได้หมวดฝั่งตรงข้าม (ไม่เอาหมวดตัวเอง)
    const pairedCategories = categoryPairings.map((pairing) =>
      pairing.categoryAId === product.categoryId ? pairing.categoryB : pairing.categoryA
    )

    // ดึงสินค้าทั้งหมดที่ active ในแต่ละหมวดที่จับคู่
    const pairedProductsPromises = pairedCategories.map((category) =>
      prisma.product.findMany({
        where: {
          categoryId: category.id,
          isActive: true,
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
        orderBy: { createdAt: "desc" },
      })
    )

    const pairedProductsArrays = await Promise.all(pairedProductsPromises)

    // รวมสินค้าจากทุกหมวดเป็น array เดียว
    const pairedProducts = pairedProductsArrays.flat()

    return NextResponse.json({
      isExclusive: false,
      pairedCategories,
      pairedProducts,
    })
  } catch (error) {
    console.error("Error fetching paired products:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 })
  }
}
