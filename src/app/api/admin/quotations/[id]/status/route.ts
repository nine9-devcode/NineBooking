// app/api/admin/quotations/[id]/status/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { AUDIT_ACTIONS, recordAudit } from "@/lib/audit"
import { clientIp } from "@/lib/rate-limit"
import { updateStatusSchema } from "@/features/quotations/components/schema"

// PATCH - อัปเดตสถานะใบเสนอราคา
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params
    const body = await request.json()

    // Validate input
    const validationResult = updateStatusSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { status } = validationResult.data

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
    })

    if (!existingQuotation) {
      return NextResponse.json({ error: "ไม่พบใบเสนอราคา" }, { status: 404 })
    }

    const updatedQuotation = await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.update({
        where: { id },
        data: {
          status,
          // จำวันที่ส่งไว้ ใช้ทั้งในหน้าลูกค้าและตอนคำนวณว่าหมดอายุหรือยัง
          ...(status === "SENT" && !existingQuotation.sentAt && { sentAt: new Date() }),
        },
      })

      await recordAudit(tx, {
        actorId: guard.user.id,
        action:
          status === "SENT"
            ? AUDIT_ACTIONS.QUOTATION_SENT
            : AUDIT_ACTIONS.QUOTATION_STATUS_CHANGED,
        entityType: "Quotation",
        entityId: id,
        entityLabel: existingQuotation.quotationNumber,
        before: { status: existingQuotation.status },
        after: { status },
        ip: clientIp(request.headers),
      })

      return quotation
    })

    return NextResponse.json({
      success: true,
      quotation: {
        id: updatedQuotation.id,
        quotationNumber: updatedQuotation.quotationNumber,
        status: updatedQuotation.status,
        updatedAt: updatedQuotation.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error updating quotation status:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" }, { status: 500 })
  }
}
