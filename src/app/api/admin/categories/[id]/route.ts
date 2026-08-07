import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { AUDIT_ACTIONS, recordAudit } from "@/lib/audit"
import { clientIp } from "@/lib/rate-limit"

// Type สำหรับ Category with children
interface CategoryWithChildren {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  isActive: boolean
  children: { id: string; name: string }[]
  _count: {
    children: number
    products: number
  }
}

// PATCH - แก้ไขหมวดหมู่ (รองรับ parentId)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const params = await context.params
    const body = await request.json()
    const { name, slug, description, isActive, parentId } = body

    // ตรวจสอบว่าหมวดหมู่มีอยู่จริง
    const existingCategory = (await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        children: {
          select: { id: true, name: true },
        },
        _count: {
          select: { children: true, products: true },
        },
      },
    })) as CategoryWithChildren | null

    if (!existingCategory) {
      return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 })
    }

    // ตรวจสอบว่า slug ซ้ำหรือไม่ (ยกเว้นหมวดหมู่ตัวเอง)
    if (slug && slug !== existingCategory.slug) {
      const duplicateSlug = await prisma.category.findUnique({
        where: { slug },
      })

      if (duplicateSlug) {
        return NextResponse.json({ error: "Slug นี้ถูกใช้งานแล้ว" }, { status: 400 })
      }
    }

    // ตรวจสอบ parentId (ถ้ามีการเปลี่ยน)
    if (parentId !== undefined) {
      // ไม่อนุญาตให้เลือกตัวเองเป็น parent
      if (parentId === params.id) {
        return NextResponse.json(
          { error: "ไม่สามารถเลือกตัวเองเป็นหมวดหมู่หลักได้" },
          { status: 400 }
        )
      }

      // ไม่อนุญาตให้เลือก children ของตัวเองเป็น parent
      if (parentId && existingCategory.children) {
        const isChild = existingCategory.children.some(
          (child: { id: string }) => child.id === parentId
        )
        if (isChild) {
          return NextResponse.json(
            { error: "ไม่สามารถเลือกหมวดหมู่ย่อยของตัวเองเป็นหมวดหมู่หลักได้" },
            { status: 400 }
          )
        }
      }

      // ตรวจสอบว่า parent มีอยู่จริง
      if (parentId) {
        const parentCategory = await prisma.category.findUnique({
          where: { id: parentId },
        })

        if (!parentCategory) {
          return NextResponse.json({ error: "ไม่พบหมวดหมู่หลัก" }, { status: 404 })
        }

        // จำกัด 2 ระดับ - ไม่อนุญาตให้เป็น child ของ child
        if (parentCategory.parentId) {
          return NextResponse.json(
            { error: "ไม่สามารถย้ายไปอยู่ภายใต้หมวดหมู่ย่อยได้ (จำกัด 2 ระดับ)" },
            { status: 400 }
          )
        }

        // ถ้า category นี้มี children อยู่แล้ว ไม่อนุญาตให้เป็น child ของอื่น
        if (existingCategory._count.children > 0) {
          return NextResponse.json(
            { error: "ไม่สามารถย้ายหมวดหมู่ที่มีหมวดหมู่ย่อยไปเป็นหมวดหมู่ย่อยของอื่นได้" },
            { status: 400 }
          )
        }
      }
    }

    // อัปเดตหมวดหมู่
    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: name || existingCategory.name,
        slug: slug || existingCategory.slug,
        description: description !== undefined ? description : existingCategory.description,
        isActive: isActive !== undefined ? isActive : existingCategory.isActive,
        parentId: parentId !== undefined ? parentId || null : existingCategory.parentId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { products: true, children: true },
        },
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดตหมวดหมู่" }, { status: 500 })
  }
}

// Type สำหรับ child with products count
interface ChildWithProductCount {
  id: string
  name: string
  _count: {
    products: number
  }
}

// DELETE - ลบหมวดหมู่ (รองรับ cascade delete children)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const params = await context.params

    // ตรวจสอบว่าหมวดหมู่มีอยู่จริง
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
        children: {
          include: {
            _count: {
              select: { products: true },
            },
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 })
    }

    // ตรวจสอบว่ามีสินค้าในหมวดหมู่หรือไม่
    if (category._count.products > 0) {
      return NextResponse.json(
        {
          error: `ไม่สามารถลบได้ เนื่องจากมีสินค้า ${category._count.products} รายการในหมวดหมู่นี้`,
          productsCount: category._count.products,
        },
        { status: 400 }
      )
    }

    // ตรวจสอบว่า children มีสินค้าหรือไม่
    const childrenWithProducts = (category.children as ChildWithProductCount[]).filter(
      (child) => child._count.products > 0
    )

    if (childrenWithProducts.length > 0) {
      const totalChildProducts = childrenWithProducts.reduce(
        (sum, child) => sum + child._count.products,
        0
      )
      return NextResponse.json(
        {
          error: `ไม่สามารถลบได้ เนื่องจากมีสินค้า ${totalChildProducts} รายการในหมวดหมู่ย่อย`,
          productsCount: totalChildProducts,
          childrenWithProducts: childrenWithProducts.map((c) => ({
            id: c.id,
            name: c.name,
            productsCount: c._count.products,
          })),
        },
        { status: 400 }
      )
    }

    // ลบหมวดหมู่จาก Database (Cascade จะลบ children อัตโนมัติ)
    await prisma.$transaction(async (tx) => {
      await tx.category.delete({ where: { id: params.id } })

      await recordAudit(tx, {
        actorId: guard.user.id,
        action: AUDIT_ACTIONS.CATEGORY_DELETED,
        entityType: "Category",
        entityId: params.id,
        entityLabel: category.name,
        before: { name: category.name, slug: category.slug },
        ip: clientIp(request.headers),
      })
    })

    return NextResponse.json({
      message: "ลบหมวดหมู่สำเร็จ",
      deletedChildren: category._count.children,
    })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบหมวดหมู่" }, { status: 500 })
  }
}
