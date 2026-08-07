import { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/api/guards"
import { apiError, apiOk, handleApiError, notFound } from "@/lib/api/response"
import { prisma } from "@/lib/db"
import { sanitizeRichText } from "@/lib/sanitize"
import { deleteFiles } from "@/lib/storage"
import type { DatasheetJSON } from "@/features/products/datasheet.types"

/** เอาเฉพาะ datasheet ที่เป็นไฟล์อัปโหลด (ไม่ใช่ลิงก์ภายนอก) มาลบออกจากดิสก์ */
function uploadedDatasheetUrls(datasheets: unknown): string[] {
  if (!Array.isArray(datasheets)) return []

  return (datasheets as DatasheetJSON[])
    .filter((item) => item?.type === "file" && Boolean(item.value))
    .map((item) => item.value)
}

// PATCH /api/admin/products/[id] — แก้ไขสินค้า
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await context.params
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
      showCategoryPairings,
    } = body

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return notFound("สินค้า")

    // ตรวจความถูกต้องให้จบก่อน แล้วค่อยแตะไฟล์บนดิสก์
    // ไม่งั้นถ้า validation ไม่ผ่านทีหลัง ไฟล์เก่าจะถูกลบไปแล้วทั้งที่ข้อมูลไม่ได้เปลี่ยน
    if (slug && slug !== existing.slug) {
      const duplicateSlug = await prisma.product.findUnique({ where: { slug } })
      if (duplicateSlug) return apiError("Slug นี้ถูกใช้งานแล้ว")
    }

    if (categoryId && categoryId !== existing.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      })
      if (!category) return apiError("ไม่พบหมวดหมู่ที่เลือก")
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        subtitle: subtitle !== undefined ? subtitle : existing.subtitle,
        slug: slug ?? existing.slug,
        // sanitize ตอนเขียน — DOMPurify ที่ฝั่งแสดงผลเป็น client component
        // จึงไม่ทำงานตอน SSR ต้องกันที่ต้นทางแทน
        description:
          description !== undefined ? sanitizeRichText(description) : existing.description,
        image: image !== undefined ? image : existing.image,
        images: images !== undefined ? images : existing.images,
        datasheets: datasheets !== undefined ? datasheets : existing.datasheets,
        categoryId: categoryId ?? existing.categoryId,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        showCategoryPairings:
          showCategoryPairings !== undefined
            ? showCategoryPairings
            : existing.showCategoryPairings,
      },
      include: { category: true },
    })

    // เก็บกวาดไฟล์ที่ไม่ถูกอ้างถึงแล้ว หลังอัปเดตสำเร็จ
    const orphaned: string[] = []

    if (image && image !== existing.image && existing.image) {
      orphaned.push(existing.image)
    }

    if (images) {
      orphaned.push(...existing.images.filter((old) => !images.includes(old)))
    }

    if (datasheets) {
      const oldFiles = uploadedDatasheetUrls(existing.datasheets)
      const newFiles = new Set(uploadedDatasheetUrls(datasheets))
      orphaned.push(...oldFiles.filter((url) => !newFiles.has(url)))
    }

    await deleteFiles(orphaned)

    return apiOk(product)
  } catch (error) {
    return handleApiError(error, "admin/products:update")
  }
}

// DELETE /api/admin/products/[id] — ลบสินค้าพร้อมไฟล์ที่แนบไว้
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await context.params

    const product = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    })

    if (!product) return notFound("สินค้า")

    // มีคนจองไปแล้ว ลบไม่ได้ เพราะจะทำให้ประวัติการจองเสียหาย
    if (product._count.orderItems > 0) {
      return apiError(
        `ไม่สามารถลบได้ เนื่องจากมีการจอง ${product._count.orderItems} รายการ`,
        400,
        { ordersCount: product._count.orderItems }
      )
    }

    await prisma.product.delete({ where: { id } })

    await deleteFiles([
      ...(product.image ? [product.image] : []),
      ...product.images,
      ...uploadedDatasheetUrls(product.datasheets),
    ])

    return apiOk({ message: "ลบสินค้าสำเร็จ" })
  } catch (error) {
    return handleApiError(error, "admin/products:delete")
  }
}
