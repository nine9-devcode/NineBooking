// app/api/admin/quotations/[id]/pdf/route.tsx

import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"

import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { companyDefaults } from "@/config/company"
import { QuotationPDF } from "@/features/quotations/pdf/quotation-document"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params

    // Fetch quotation with all details
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        order: true,
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    })

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    // Fetch company settings and active seller
    const DEFAULT_COMPANY = {
      companyNameTh: companyDefaults.nameTh,
      companyNameEn: companyDefaults.nameEn,
      address: companyDefaults.address,
      taxId: companyDefaults.taxId,
      phone: companyDefaults.phone,
      website: companyDefaults.website,
    }

    const [companySettings, activeSeller] = await Promise.all([
      prisma.quotationSettings.findFirst().then((s) => s ?? DEFAULT_COMPANY),
      prisma.quotationSeller.findFirst({ where: { isActive: true } }),
    ])

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <QuotationPDF
        quotation={quotation}
        companySettings={companySettings}
        seller={activeSeller}
      />
    )

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quotation-${quotation.quotationNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating quotation PDF:", error)
    return NextResponse.json({ error: "Failed to generate quotation PDF" }, { status: 500 })
  }
}
