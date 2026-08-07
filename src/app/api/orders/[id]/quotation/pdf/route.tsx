import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"

import { requireUser } from "@/lib/api/guards"
import { forbidden, handleApiError, notFound } from "@/lib/api/response"
import { companyDefaults } from "@/config/company"
import { prisma } from "@/lib/db"
import { QuotationPDF } from "@/features/quotations/pdf/quotation-document"

/**
 * ลูกค้าดาวน์โหลดใบเสนอราคาของตัวเอง
 *
 * ใช้เอกสารตัวเดียวกับฝั่งแอดมิน ต่างกันแค่การตรวจสิทธิ์:
 * ต้องเป็นเจ้าของคำสั่งจอง และเห็นเฉพาะฉบับที่ส่งให้แล้ว (ไม่เห็นฉบับร่าง)
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireUser()
    if (!guard.ok) return guard.response

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!order) return notFound("คำสั่งจอง")
    if (order.userId !== guard.user.id) return forbidden()

    const quotation = await prisma.quotation.findFirst({
      where: { orderId: id, isLatest: true, status: { not: "DRAFT" } },
      include: { order: true, items: { orderBy: { sortOrder: "asc" } } },
    })

    if (!quotation) return notFound("ใบเสนอราคา")

    const [companySettings, activeSeller] = await Promise.all([
      prisma.quotationSettings.findFirst().then(
        (settings) =>
          settings ?? {
            companyNameTh: companyDefaults.nameTh,
            companyNameEn: companyDefaults.nameEn,
            address: companyDefaults.address,
            taxId: companyDefaults.taxId,
            phone: companyDefaults.phone,
            website: companyDefaults.website,
          }
      ),
      prisma.quotationSeller.findFirst({ where: { isActive: true } }),
    ])

    const pdf = await renderToBuffer(
      <QuotationPDF
        quotation={quotation}
        companySettings={companySettings}
        seller={activeSeller}
      />
    )

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${quotation.quotationNumber}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    return handleApiError(error, "orders/quotation:pdf")
  }
}
