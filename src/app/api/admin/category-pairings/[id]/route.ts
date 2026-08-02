import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"

// DELETE - ลบ pairing
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const params = await context.params

    // ตรวจสอบว่า pairing มีอยู่จริง
    const pairing = await prisma.categoryPairing.findUnique({
      where: { id: params.id },
      include: {
        categoryA: { select: { name: true } },
        categoryB: { select: { name: true } },
      },
    })

    if (!pairing) {
      return NextResponse.json(
        { error: "ไม่พบการจับคู่หมวดหมู่" },
        { status: 404 }
      )
    }

    // ลบ pairing
    await prisma.categoryPairing.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: `ยกเลิกการจับคู่ "${pairing.categoryA.name}" กับ "${pairing.categoryB.name}" สำเร็จ`,
    })
  } catch (error) {
    console.error("Error deleting category pairing:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบการจับคู่" },
      { status: 500 }
    )
  }
}
