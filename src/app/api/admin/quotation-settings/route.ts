// app/api/admin/quotation-settings/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { companyDefaults, PDF_LOGO_RELATIVE_PATH } from "@/config/company"

const DEFAULT_SETTINGS = {
  companyNameTh: companyDefaults.nameTh,
  companyNameEn: companyDefaults.nameEn,
  address: companyDefaults.address,
  taxId: companyDefaults.taxId,
  phone: companyDefaults.phone,
  website: companyDefaults.website,
}

export async function GET() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    let settings = await prisma.quotationSettings.findFirst()

    if (!settings) {
      settings = await prisma.quotationSettings.create({ data: DEFAULT_SETTINGS })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching quotation settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const body = await request.json()
    const { companyNameTh, companyNameEn, address, taxId, phone, website } = body

    let settings = await prisma.quotationSettings.findFirst()

    if (!settings) {
      settings = await prisma.quotationSettings.create({
        data: {
          companyNameTh: companyNameTh ?? DEFAULT_SETTINGS.companyNameTh,
          companyNameEn: companyNameEn ?? DEFAULT_SETTINGS.companyNameEn,
          address: address ?? DEFAULT_SETTINGS.address,
          taxId: taxId ?? DEFAULT_SETTINGS.taxId,
          phone: phone ?? DEFAULT_SETTINGS.phone,
          website: website ?? DEFAULT_SETTINGS.website,
        },
      })
    } else {
      settings = await prisma.quotationSettings.update({
        where: { id: settings.id },
        data: {
          ...(companyNameTh !== undefined && { companyNameTh }),
          ...(companyNameEn !== undefined && { companyNameEn }),
          ...(address !== undefined && { address }),
          ...(taxId !== undefined && { taxId }),
          ...(phone !== undefined && { phone }),
          ...(website !== undefined && { website }),
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error updating quotation settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
