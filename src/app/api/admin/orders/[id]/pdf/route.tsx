// ไฟล์: app/api/admin/orders/[id]/pdf/route.tsx
// GET /api/admin/orders/[id]/pdf - Export single order as PDF

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
  StyleSheet,
} from "@/lib/pdf"
import { pdfTheme } from "@/config/pdf-theme"

// Residence type mapping
const RESIDENCE_TYPES: Record<string, string> = {
  single_house: "บ้านเดี่ยว",
  condo: "คอนโด",
  townhouse: "ทาวน์เฮาส์",
  apartment: "อพาร์ทเมนต์",
}

// Additional styles for order items
const orderStyles = StyleSheet.create({
  // Main product row
  mainProductRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingVertical: 8,
    paddingHorizontal: 5,
    backgroundColor: "#ffffff",
  },
  // Paired product row (indented)
  pairedProductRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 5,
    paddingLeft: 25,
    backgroundColor: "#fafafa",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  // Tree connector
  treeConnector: {
    color: "#999999",
    fontSize: 9,
    marginRight: 5,
  },
  // Paired badge
  pairedBadge: {
    fontSize: 7,
    color: pdfTheme.primary,
    backgroundColor: pdfTheme.primarySoft,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    marginLeft: 5,
  },
  // No paired text
  noPairedText: {
    fontSize: 8,
    color: "#999999",
    fontStyle: "italic",
    paddingLeft: 25,
    paddingVertical: 4,
  },
  // Summary section
  summarySection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#dddddd",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#666666",
    marginRight: 10,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333333",
    width: 60,
    textAlign: "right",
  },
})

// Type definitions
interface PairedProduct {
  name: string
  quantity: number
}

interface GroupedItem {
  productId: string
  productName: string
  quantity: number
  pairedProducts: PairedProduct[]
}

// Order PDF Document Component
const OrderPDF = ({ order }: { order: any }) => {
  // Group items by main product and collect paired products
  const groupedItems: GroupedItem[] = []

  order.orderItems.forEach((item: any) => {
    // 1. หา Group ของสินค้านั้นๆ (ถ้าไม่มีก็สร้างใหม่)
    let group = groupedItems.find((g) => g.productId === item.productId)

    if (!group) {
      group = {
        productId: item.productId,
        productName: item.productName,
        quantity: 0,
        pairedProducts: [],
      }
      groupedItems.push(group)
    }

    // 2. [จุดที่แก้] เช็คเงื่อนไขก่อนบวกเลข
    if (item.pairedProductId && item.pairedProductName) {
      // === กรณีเป็น "สินค้าคู่" ===
      // ไม่ต้องบวก group.quantity (สินค้าหลัก) ให้บวกแค่ใน pairedProducts
      const existingPaired = group.pairedProducts.find((p) => p.name === item.pairedProductName)

      if (existingPaired) {
        existingPaired.quantity += item.quantity
      } else {
        group.pairedProducts.push({
          name: item.pairedProductName,
          quantity: item.quantity,
        })
      }
    } else {
      // === กรณีเป็น "สินค้าหลัก (ไม่มีคู่)" ===
      // ค่อยบวกยอดเข้าสินค้าหลัก
      group.quantity += item.quantity
    }
  })

  // Calculate totals
  const totalMainItems = groupedItems.length
  const totalMainQuantity = groupedItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalPairedQuantity = groupedItems.reduce(
    (sum, item) => sum + item.pairedProducts.reduce((ps, p) => ps + p.quantity, 0),
    0
  )

  // Build full address
  const addressParts = [
    order.shippingAddress,
    order.shippingSubDistrict,
    order.shippingDistrict,
    order.shippingProvince,
    order.shippingPostalCode,
  ].filter(Boolean)
  const fullAddress = addressParts.join(" ") || "-"

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.headerTitle}>NINEBOOKING</Text>
          <Text style={pdfStyles.headerSubtitle}>ใบจองสินค้า</Text>
        </View>

        {/* Order Info */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>ข้อมูลใบจอง</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>เลขที่ใบจอง:</Text>
            <Text style={pdfStyles.value}>{order.orderNumber}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>วันที่จอง:</Text>
            <Text style={pdfStyles.value}>{formatThaiDate(order.createdAt)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>สถานะ:</Text>
            <Text style={[pdfStyles.value, getStatusStyle(order.status)]}>
              {STATUS_TEXT[order.status] || order.status}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>ข้อมูลลูกค้า</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>ชื่อ:</Text>
            <Text style={pdfStyles.value}>
              {order.customerName}
              {order.customerNickname ? ` (${order.customerNickname})` : ""}
            </Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>เบอร์โทรศัพท์:</Text>
            <Text style={pdfStyles.value}>{order.customerPhone || "-"}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>อีเมล:</Text>
            <Text style={pdfStyles.value}>{order.customerEmail || "-"}</Text>
          </View>
        </View>

        {/* Shipping Info */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>ที่อยู่จัดส่ง</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>ที่อยู่:</Text>
            <Text style={pdfStyles.value}>{fullAddress}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>ประเภทที่อยู่:</Text>
            <Text style={pdfStyles.value}>
              {order.shippingResidenceType
                ? RESIDENCE_TYPES[order.shippingResidenceType] || order.shippingResidenceType
                : "-"}
            </Text>
          </View>
        </View>

        {/* Order Items - Nested Style */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>รายการสินค้า</Text>
          <View style={pdfStyles.table}>
            {/* Table Header */}
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, { width: 30 }]}>#</Text>
              <Text style={[pdfStyles.tableHeaderCell, { flex: 1 }]}>สินค้า</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: 60, textAlign: "center" }]}>
                จำนวน{" "}
              </Text>
            </View>

            {/* Table Rows - Grouped with Nested Paired */}
            {groupedItems.map((item, index) => (
              <View key={item.productId}>
                {/* Main Product Row */}
                <View style={orderStyles.mainProductRow}>
                  <Text style={[pdfStyles.tableCell, { width: 30, fontWeight: "bold" }]}>
                    {index + 1}
                  </Text>
                  <Text style={[pdfStyles.tableCell, { flex: 1, fontWeight: "bold" }]}>
                    {item.productName}
                  </Text>
                  <Text style={[pdfStyles.tableCell, { width: 60, textAlign: "center" }]}>
                    {item.quantity} ชิ้น
                  </Text>
                </View>

                {/* Paired Products (Nested) */}
                {item.pairedProducts.length > 0 ? (
                  item.pairedProducts.map((paired, pIndex) => (
                    <View key={pIndex} style={orderStyles.pairedProductRow}>
                      <Text style={[pdfStyles.tableCell, { width: 30 }]}></Text>
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                        <Text style={orderStyles.treeConnector}>—</Text>
                        <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{paired.name}</Text>
                        <Text style={orderStyles.pairedBadge}>จับคู่</Text>
                      </View>
                      <Text
                        style={[
                          pdfStyles.tableCell,
                          { width: 60, textAlign: "center", color: "#666666" },
                        ]}
                      >
                        {paired.quantity} ชิ้น
                      </Text>
                    </View>
                  ))
                ) : (
                  <View
                    style={{
                      backgroundColor: "#fafafa",
                      borderBottomWidth: 1,
                      borderBottomColor: "#f0f0f0",
                    }}
                  >
                    <Text style={orderStyles.noPairedText}>— ไม่มีสินค้าจับคู่</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Summary */}
          <View style={orderStyles.summarySection}>
            <View style={orderStyles.summaryRow}>
              <Text style={orderStyles.summaryLabel}>สินค้าหลัก:</Text>
              <Text style={orderStyles.summaryValue}>{totalMainItems} รายการ</Text>
            </View>
            <View style={orderStyles.summaryRow}>
              <Text style={orderStyles.summaryLabel}>จำนวนสินค้าหลัก:</Text>
              <Text style={orderStyles.summaryValue}>{totalMainQuantity} ชิ้น</Text>
            </View>
            {totalPairedQuantity > 0 && (
              <View style={orderStyles.summaryRow}>
                <Text style={orderStyles.summaryLabel}>จำนวนสินค้าจับคู่:</Text>
                <Text style={orderStyles.summaryValue}>{totalPairedQuantity} ชิ้น</Text>
              </View>
            )}
            <View
              style={[
                orderStyles.summaryRow,
                { borderTopWidth: 1, borderTopColor: "#eeeeee", paddingTop: 5, marginTop: 5 },
              ]}
            >
              <Text style={[orderStyles.summaryLabel, { fontWeight: "bold" }]}>
                รวมทั้งหมด:
              </Text>
              <Text style={[orderStyles.summaryValue, { fontSize: 11 }]}>
                {totalMainQuantity + totalPairedQuantity} ชิ้น
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Note */}
        {order.customerNote && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>หมายเหตุจากลูกค้า</Text>
            <View style={pdfStyles.noteBox}>
              <Text style={pdfStyles.noteText}>{order.customerNote}</Text>
            </View>
          </View>
        )}

        {/* Admin Note */}
        {order.adminNote && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>หมายเหตุจาก Admin</Text>
            <View style={pdfStyles.noteBox}>
              <Text style={pdfStyles.noteText}>{order.adminNote}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          เอกสารนี้ออกโดยระบบ NineBooking | วันที่พิมพ์: {formatThaiDate(new Date())}
        </Text>
      </Page>
    </Document>
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params

    // Fetch order with all details
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                image: true,
              },
            },
            pairedProduct: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            nickname: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(<OrderPDF order={order} />)

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="order-${order.orderNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
