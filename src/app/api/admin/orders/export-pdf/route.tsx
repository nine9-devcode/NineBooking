// ไฟล์: app/api/admin/orders/export-pdf/route.ts
// GET /api/admin/orders/export-pdf - Export orders list as PDF

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { renderToBuffer } from "@react-pdf/renderer"
import {
  Document,
  Page,
  Text,
  View,
  pdfStyles,
  STATUS_TEXT,
  getStatusStyle,
  formatThaiDate,
  formatShortDate,
  StyleSheet,
} from "@/lib/pdf"
import { getMemberTypeLabel } from "@/lib/constants"
import { OrderStatus, Prisma } from "@prisma/client"
import { parseEnumParam } from "@/lib/api/query"

// Additional styles for list PDF
const listStyles = StyleSheet.create({
  filterInfo: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 15,
  },
  summaryRow: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#dddddd",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  summaryText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#333333",
  },
})

// Orders List PDF Component
const OrdersListPDF = ({ orders, filterInfo }: { orders: any[]; filterInfo: string }) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.headerTitle}>NINEBOOKING</Text>
          <Text style={pdfStyles.headerSubtitle}>รายการคำสั่งจอง </Text>
        </View>

        {/* Filter Info */}
        <Text style={listStyles.filterInfo}>{filterInfo}</Text>

        {/* Table */}
        <View style={pdfStyles.table}>
          {/* Table Header */}
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, { width: 25 }]}>#</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 85 }]}>เลขที่ใบจอง</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 60 }]}>วันที่จอง</Text>
            <Text style={[pdfStyles.tableHeaderCell, { flex: 1 }]}>ชื่อลูกค้า</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 70 }]}>ชื่อเล่น</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 100 }]}>ประเภทสมาชิก</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 75 }]}>เบอร์โทร</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 40, textAlign: "center" }]}>
              จำนวน{" "}
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 70, textAlign: "center" }]}>
              สถานะ
            </Text>
          </View>

          {/* Table Rows */}
          {orders.map((order, index) => {
            const totalItems = order.orderItems.reduce(
              (sum: number, item: any) => sum + item.quantity,
              0
            )

            // สร้างข้อความประเภทสมาชิก + หมายเหตุ
            const memberTypeText = getMemberTypeLabel(order.user?.memberType ?? null)
            const memberTypeNote = order.user?.memberTypeNote
            const memberTypeDisplay = memberTypeNote
              ? `${memberTypeText}\n(${memberTypeNote})`
              : memberTypeText

            return (
              <View key={order.id} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: 25 }]}>{index + 1}</Text>
                <Text style={[pdfStyles.tableCell, { width: 85 }]}>{order.orderNumber}</Text>
                <Text style={[pdfStyles.tableCell, { width: 60 }]}>
                  {formatShortDate(order.createdAt)}
                </Text>
                <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{order.customerName}</Text>
                <Text style={[pdfStyles.tableCell, { width: 70 }]}>
                  {order.customerNickname || "-"}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: 100, fontSize: 8 }]}>
                  {memberTypeDisplay}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: 75 }]}>
                  {order.customerPhone || "-"}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: 40, textAlign: "center" }]}>
                  {totalItems}
                </Text>
                <Text
                  style={[
                    pdfStyles.tableCell,
                    { width: 70, textAlign: "center" },
                    getStatusStyle(order.status),
                  ]}
                >
                  {STATUS_TEXT[order.status] || order.status}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Summary */}
        <View style={listStyles.summaryRow}>
          <Text style={listStyles.summaryText}>รวมทั้งหมด: {orders.length} รายการ</Text>
        </View>

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          เอกสารนี้ออกโดยระบบ NineBooking | วันที่พิมพ์: {formatThaiDate(new Date())}
        </Text>
      </Page>
    </Document>
  )
}

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
        user: {
          select: {
            memberType: true,
            memberTypeNote: true,
          },
        },
      },
    })

    // Build filter info text
    let filterInfo = `ส่งออกเมื่อ: ${formatThaiDate(new Date())}`
    if (status) {
      filterInfo += ` | สถานะ: ${STATUS_TEXT[status] || status}`
    }
    if (dateFrom || dateTo) {
      const formatDateCustom = (dateStr: string) => {
        const d = new Date(dateStr)
        const day = d.getDate().toString().padStart(2, "0")
        const month = (d.getMonth() + 1).toString().padStart(2, "0")
        const year = d.getFullYear() + 543 // ปี พ.ศ. 4 หลัก
        return `${day}/${month}/${year}`
      }

      const fromStr = dateFrom ? formatDateCustom(dateFrom) : "เริ่มต้น"
      const toStr = dateTo ? formatDateCustom(dateTo) : "ปัจจุบัน"

      filterInfo += ` | ช่วงวันที่: ${fromStr} ถึง ${toStr}`
    }
    if (search) {
      filterInfo += ` | ค้นหา: "${search}"`
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <OrdersListPDF orders={orders} filterInfo={filterInfo} />
    )

    // Generate filename
    const dateStr = new Date().toISOString().split("T")[0]
    const filename = `orders-${dateStr}.pdf`

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
