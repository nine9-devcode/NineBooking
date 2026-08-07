import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"

// DELETE - ลบ Exclusive Pairing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params

    // เช็คว่ามี pairing นี้หรือไม่
    const pairing = await prisma.exclusivePairing.findUnique({
      where: { id },
      include: {
        productA: { select: { name: true } },
        productB: { select: { name: true } },
      },
    })

    if (!pairing) {
      return NextResponse.json({ error: "ไม่พบการจับคู่นี้" }, { status: 404 })
    }

    // ลบ pairing
    await prisma.exclusivePairing.delete({
      where: { id },
    })

    return NextResponse.json({
      message: `ยกเลิกการจับคู่ ${pairing.productA.name} กับ ${pairing.productB.name} สำเร็จ`,
    })
  } catch (error) {
    console.error("Error deleting exclusive pairing:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบการจับคู่" }, { status: 500 })
  }
}
