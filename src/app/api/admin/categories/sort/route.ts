import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { z } from "zod"

const sortItemSchema = z.object({
  id: z.string().min(1),
  sortOrder: z.number().int().min(0),
})

const sortSchema = z.object({
  categories: z.array(sortItemSchema).min(1).max(200),
})

// PATCH - อัพเดท sortOrder ของหมวดหมู่
export async function PATCH(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const body = await request.json()
    const parsed = sortSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { categories } = parsed.data

    // อัพเดท sortOrder
    const updatePromises = categories.map((cat) =>
      prisma.category.update({
        where: { id: cat.id },
        data: { sortOrder: cat.sortOrder },
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      message: "อัพเดทลำดับหมวดหมู่สำเร็จ",
      updated: categories.length,
    })
  } catch (error) {
    console.error("Error updating category sort order:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัพเดทลำดับหมวดหมู่" },
      { status: 500 }
    )
  }
}