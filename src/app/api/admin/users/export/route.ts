// ไฟล์: app/api/admin/members/export/route.ts
// GET /api/admin/members/export - Export members list as Excel

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import excel from "@/lib/excel"

// Residence type mapping
const RESIDENCE_TYPES: Record<string, string> = {
  single_house: "บ้านเดี่ยว",
  condo: "คอนโด",
  townhouse: "ทาวน์เฮาส์",
  apartment: "อพาร์ทเมนต์",
}

// Member type mapping
const MEMBER_TYPE_LABELS: Record<string, string> = {
  customer: "ลูกค้าทั่วไป",
  contractor: "ผู้รับเหมา",
  dealer: "ตัวแทนจำหน่าย",
  other: "อื่นๆ",
}

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)

    // Get filter params
    const search = searchParams.get("search") || ""
    const residenceType = searchParams.get("residenceType") || ""
    const memberType = searchParams.get("memberType") || ""

    // Build where clause - only non-admin users
    const where: any = {
      role: "user",
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { nickname: { contains: search, mode: "insensitive" } },
      ]
    }

    if (residenceType) {
      where.residenceType = residenceType
    }

    if (memberType && memberType !== "all") {
      where.memberType = memberType
    }

    // Fetch members with order count
    const members = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    })

    // Create workbook
    const workbook = excel.createWorkbook()
    const worksheet = workbook.addWorksheet("สมาชิก")

    // Add title
    const columnCount = 9
    excel.addTitleRow(worksheet, "รายชื่อสมาชิก", columnCount)

    // Add subtitle with export info
    let subtitleText = `ส่งออกเมื่อ: ${excel.formatShortDate(new Date())}`
    if (residenceType) {
      subtitleText += ` | ประเภทที่อยู่: ${RESIDENCE_TYPES[residenceType] || residenceType}`
    }
    if (memberType && memberType !== "all") {
      subtitleText += ` | ประเภทสมาชิก: ${MEMBER_TYPE_LABELS[memberType] || memberType}`
    }
    if (search) {
      subtitleText += ` | ค้นหา: "${search}"`
    }
    excel.addSubtitleRow(worksheet, subtitleText, columnCount)

    // Add empty row
    worksheet.addRow([])

    // Define columns
    worksheet.columns = [
      { key: "no", width: 8 },
      { key: "name", width: 25 },
      { key: "nickname", width: 15 },
      { key: "phone", width: 15 },
      { key: "email", width: 30 },
      { key: "memberType", width: 18 },
      { key: "residenceType", width: 15 },
      { key: "orderCount", width: 12 },
      { key: "createdAt", width: 15 },
    ]

    // Add header row
    const headerRow = worksheet.addRow({
      no: "ลำดับ",
      name: "ชื่อ",
      nickname: "ชื่อเล่น",
      phone: "เบอร์โทร",
      email: "อีเมล",
      memberType: "ประเภทสมาชิก",
      residenceType: "ประเภทที่อยู่",
      orderCount: "จำนวนใบจอง",
      createdAt: "วันที่สมัคร",
    })
    excel.styleHeaderRow(headerRow)

    // Add data rows
    members.forEach((member, index) => {
      const residenceDisplay = member.residenceType
        ? RESIDENCE_TYPES[member.residenceType] || member.residenceType
        : "-"

      const memberTypeDisplay = member.memberType
        ? MEMBER_TYPE_LABELS[member.memberType] || member.memberType
        : MEMBER_TYPE_LABELS["customer"] // default

      const row = worksheet.addRow({
        no: index + 1,
        name: member.name || "-",
        nickname: member.nickname || "-",
        phone: member.phone || "-",
        email: member.email || "-",
        memberType: memberTypeDisplay,
        residenceType: residenceDisplay,
        orderCount: member._count.orders,
        createdAt: excel.formatShortDate(member.createdAt),
      })

      excel.styleDataRow(row, index % 2 === 0)

      // Center align number columns
      row.getCell("no").alignment = { horizontal: "center", vertical: "middle" }
      row.getCell("orderCount").alignment = { horizontal: "center", vertical: "middle" }
    })

    // Add summary row
    worksheet.addRow([])
    const summaryRow = worksheet.addRow([`รวมทั้งหมด: ${members.length} คน`])
    worksheet.mergeCells(summaryRow.number, 1, summaryRow.number, columnCount)
    summaryRow.getCell(1).font = { bold: true, size: 11 }
    summaryRow.getCell(1).alignment = { horizontal: "right" }

    // Generate buffer
    const buffer = await excel.generateExcelBuffer(workbook)

    // Generate filename
    const dateStr = new Date().toISOString().split("T")[0]
    const filename = `members-${dateStr}.xlsx`

    // Return Excel response
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error generating Excel:", error)
    return NextResponse.json({ error: "Failed to generate Excel" }, { status: 500 })
  }
}
