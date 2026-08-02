// app/api/admin/quotation-sellers/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"

// PATCH — set seller as active
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params

    const seller = await prisma.quotationSeller.findUnique({ where: { id } })
    if (!seller) {
      return NextResponse.json({ error: "ไม่พบผู้ขาย" }, { status: 404 })
    }

    // Set all sellers inactive, then set this one active
    await prisma.quotationSeller.updateMany({ data: { isActive: false } })
    const updated = await prisma.quotationSeller.update({
      where: { id },
      data: { isActive: true },
    })

    return NextResponse.json({ seller: updated })
  } catch (error) {
    console.error("Error setting active seller:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE — remove seller
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params

    const seller = await prisma.quotationSeller.findUnique({ where: { id } })
    if (!seller) {
      return NextResponse.json({ error: "ไม่พบผู้ขาย" }, { status: 404 })
    }

    const total = await prisma.quotationSeller.count()
    if (seller.isActive && total > 1) {
      return NextResponse.json(
        { error: "ไม่สามารถลบผู้ขายที่กำลังใช้งานอยู่ได้ กรุณาเลือกผู้ขายอื่นก่อน" },
        { status: 400 }
      )
    }

    await prisma.quotationSeller.delete({ where: { id } })

    // ถ้าลบ active seller คนเดียวที่เหลือ ให้ set คนแรกเป็น active แทน
    if (seller.isActive && total > 1) {
      const first = await prisma.quotationSeller.findFirst({ orderBy: { createdAt: "asc" } })
      if (first) {
        await prisma.quotationSeller.update({ where: { id: first.id }, data: { isActive: true } })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting seller:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
