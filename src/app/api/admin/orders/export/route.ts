// ไฟล์: app/api/admin/orders/export/route.ts
// GET /api/admin/orders/export - Export orders list as Excel

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import excel from "@/lib/excel"
import { OrderStatus, Prisma } from "@prisma/client"
import { parseEnumParam } from "@/lib/api/query"

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)

    // Get filter params
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Build where clause
    const where: Prisma.OrderWhereInput = {}

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { customerNickname: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status) {
      where.status = parseEnumParam(OrderStatus, status)
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: true,
      },
    })

    // Create workbook
    const workbook = excel.createWorkbook()
    const worksheet = workbook.addWorksheet("คำสั่งจอง")

    // Add title
    const columnCount = 7
    excel.addTitleRow(worksheet, "รายการคำสั่งจอง", columnCount)

    // Add subtitle with export info
    let subtitleText = `ส่งออกเมื่อ: ${excel.formatShortDate(new Date())}`
    if (status) {
      subtitleText += ` | สถานะ: ${excel.STATUS_TEXT[status] || status}`
    }
    if (dateFrom || dateTo) {
      const formatCustomDate = (dateStr: string) => {
        const d = new Date(dateStr)
        const day = d.getDate().toString().padStart(2, "0")
        const month = (d.getMonth() + 1).toString().padStart(2, "0")
        const year = d.getFullYear() + 543 // พ.ศ. 4 หลัก
        return `${day}/${month}/${year}`
      }

      const fromStr = dateFrom ? formatCustomDate(dateFrom) : "..."
      const toStr = dateTo ? formatCustomDate(dateTo) : "..."

      subtitleText += ` | ช่วงวันที่: ${fromStr} ถึง ${toStr}`
    }
    if (search) {
      subtitleText += ` | ค้นหา: "${search}"`
    }
    excel.addSubtitleRow(worksheet, subtitleText, columnCount)

    // Add empty row
    worksheet.addRow([])

    // Define columns
    worksheet.columns = [
      { key: "orderNumber", width: 20 },
      { key: "createdAt", width: 15 },
      { key: "customerName", width: 20 },
      { key: "customerNickname", width: 15 },
      { key: "customerPhone", width: 15 },
      { key: "itemCount", width: 12 },
      { key: "status", width: 15 },
    ]

    // Add header row
    const headerRow = worksheet.addRow({
      orderNumber: "เลขที่ใบจอง",
      createdAt: "วันที่จอง",
      customerName: "ชื่อลูกค้า",
      customerNickname: "ชื่อเล่น",
      customerPhone: "เบอร์โทร",
      itemCount: "จำนวนสินค้า",
      status: "สถานะ",
    })
    excel.styleHeaderRow(headerRow)

    // Add data rows
    orders.forEach((order, index) => {
      const totalItems = order.orderItems.reduce((sum, item) => sum + item.quantity, 0)

      const row = worksheet.addRow({
        orderNumber: order.orderNumber,
        createdAt: excel.formatShortDate(order.createdAt),
        customerName: order.customerName,
        customerNickname: order.customerNickname || "-",
        customerPhone: order.customerPhone || "-",
        itemCount: totalItems,
        status: excel.STATUS_TEXT[order.status] || order.status,
      })

      excel.styleDataRow(row, index % 2 === 0)

      // Style status cell
      const statusCell = row.getCell("status")
      excel.styleStatusCell(statusCell, order.status)
    })

    // Add summary row
    worksheet.addRow([])
    const summaryRow = worksheet.addRow([`รวมทั้งหมด: ${orders.length} รายการ`])
    worksheet.mergeCells(summaryRow.number, 1, summaryRow.number, columnCount)
    summaryRow.getCell(1).font = { bold: true, size: 11 }
    summaryRow.getCell(1).alignment = { horizontal: "right" }

    // Generate buffer
    const buffer = await excel.generateExcelBuffer(workbook)

    // Generate filename
    const dateStr = new Date().toISOString().split("T")[0]
    const filename = `orders-${dateStr}.xlsx`

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
