// app/api/admin/orders/[id]/quotation/route.tsx
// GET /api/admin/orders/[id]/quotation - Export order as Quotation PDF

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { renderToBuffer } from "@react-pdf/renderer"
import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer"
import path from "path"
import fs from "fs"
import { companyDefaults, PDF_LOGO_RELATIVE_PATH } from "@/config/company"
import { pdfTheme } from "@/config/pdf-theme"

// Register Thai font (Sarabun)
const fontDir = path.join(process.cwd(), "public", "fonts")

Font.register({
  family: "Sarabun",
  fonts: [
    {
      src: path.join(fontDir, "Sarabun-Regular.ttf"),
      fontWeight: "normal",
    },
    {
      src: path.join(fontDir, "Sarabun-Bold.ttf"),
      fontWeight: "bold",
    },
    {
      src: path.join(fontDir, "Sarabun-Medium.ttf"),
      fontWeight: "medium",
    },

    { src: path.join(fontDir, "Sarabun-Italic.ttf"), fontStyle: "italic" },
  ],
})

// Styles for Quotation PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Sarabun",
    fontSize: 10,
    backgroundColor: "#ffffff",
  },
  // Header with logo and company info
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
  },
  logoSection: {
    width: 150,
  },
  logo: {
    width: 140,
    height: "auto",
    objectFit: "contain",
  },
  companyInfoSection: {
    flex: 1,
    paddingLeft: 15,
  },
  companyName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 2,
  },
  companyNameEng: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 8,
    color: "#000000",
    lineHeight: 1.3,
  },
  // Quote info section (right side)
  quoteInfoSection: {
    width: 180,
    paddingLeft: 10,
  },
  quoteTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 6,
  },
  quoteInfoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  quoteLabel: {
    fontSize: 9,
    color: "#000000",
    width: 50,
  },
  quoteValue: {
    fontSize: 9,
    color: "#000000",
    flex: 1,
  },
  // Customer section
  customerSection: {
    marginTop: 12,
    marginBottom: 15,
  },
  customerTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#000000",
  },
  customerInfoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  customerLabel: {
    fontSize: 9,
    color: "#000000",
    width: 100,
  },
  customerValue: {
    fontSize: 9,
    color: "#000000",
    flex: 1,
  },
  // Table
  table: {
    marginTop: 15,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableCell: {
    fontSize: 9,
    color: "#000000",
  },
  // Nested paired product
  pairedRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  treeIcon: {
    fontSize: 8,
    color: "#666666",
    marginRight: 4,
  },
  pairedBadge: {
    fontSize: 7,
    color: pdfTheme.primary,
    backgroundColor: pdfTheme.primarySoft,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginLeft: 4,
  },
  noPairedText: {
    fontSize: 8,
    color: "#999999",
    fontStyle: "italic",
    paddingLeft: 20,
    paddingVertical: 4,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  // Summary section
  summarySection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#000000",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
    paddingRight: 10,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#000000",
    marginRight: 15,
    width: 150,
    textAlign: "right",
  },
  summaryValue: {
    fontSize: 9,
    color: "#000000",
    width: 100,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
    paddingTop: 5,
    paddingRight: 10,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
    marginRight: 15,
    width: 150,
    textAlign: "right",
  },
  totalValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
    width: 100,
    textAlign: "right",
  },
  totalInWords: {
    fontSize: 8,
    color: "#000000",
    textAlign: "right",
    marginTop: 2,
    marginRight: 10,
    fontStyle: "italic",
  },
  // Notes section
  notesSection: {
    marginTop: 15,
    marginBottom: 10,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#000000",
  },
  notesText: {
    fontSize: 8,
    lineHeight: 1.4,
    color: "#000000",
  },
  notesBullet: {
    fontSize: 8,
    color: "#000000",
    marginBottom: 2,
  },
  // Additional info
  additionalInfo: {
    marginTop: 10,
    fontSize: 8,
    color: "#000000",
  },
  // Signature section
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingTop: 15,
  },
  signatureBox: {
    width: "48%",
    alignItems: "center",
  },
  signatureCompany: {
    fontSize: 8,
    color: "#000000",
    marginBottom: 5,
    textAlign: "center",
  },
  signatureLine: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginBottom: 5,
    height: 40,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#000000",
  },
  signatureDate: {
    fontSize: 8,
    color: "#000000",
    marginTop: 3,
  },
})

// Helper: Format date to Thai format
const formatThaiDate = (date: Date): string => {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, "0")
  const month = d.toLocaleDateString("th-TH", { month: "long" })
  const year = d.getFullYear() + 543
  return `${day} ${month} ${year}`
}

const formatShortDate = (date: Date): string => {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, "0")
  const month = (d.getMonth() + 1).toString().padStart(2, "0")
  const year = d.getFullYear() + 543
  return `${day}/${month}/${year}`
}

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

// Quotation PDF Component
const QuotationPDF = ({ order }: { order: any }) => {
  const logoPath = path.join(process.cwd(), ...PDF_LOGO_RELATIVE_PATH)
  let logoBuffer = null

  try {
    // อ่านไฟล์ภาพออกมาเป็น Buffer
    logoBuffer = fs.readFileSync(logoPath)
  } catch (error) {
    console.error("หาไฟล์รูปไม่เจอ:", logoPath)
    // อาจจะใส่รูป default หรือปล่อยว่างไว้ถ้าหาไม่เจอ
  }

  // Group items by main product
  const groupedItems: GroupedItem[] = []

  order.orderItems.forEach((item: any) => {
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

    if (item.pairedProductId && item.pairedProductName) {
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
      group.quantity += item.quantity
    }
  })

  // Calculate totals
  const totalMainQuantity = groupedItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalPairedQuantity = groupedItems.reduce(
    (sum, item) => sum + item.pairedProducts.reduce((ps, p) => ps + p.quantity, 0),
    0
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Left: Logo */}
          <View style={styles.logoSection}>
            {/* เช็คก่อนว่าอ่านไฟล์ได้ไหม เพื่อกัน Error */}
            {logoBuffer ? (
              <Image src={logoBuffer} style={styles.logo} />
            ) : (
              <Text>Image not found</Text>
            )}
          </View>

          {/* Center: Company Info */}
          <View style={styles.companyInfoSection}>
            <Text style={styles.companyName}>{companyDefaults.nameTh}</Text>

            <Text style={styles.companyNameEng}>{companyDefaults.nameEn}</Text>

            <Text style={styles.companyAddress}>
              {`${companyDefaults.address}\n` +
                `เลขประจำตัวผู้เสียภาษี ${companyDefaults.taxId}\n` +
                `โทร ${companyDefaults.phone}\n` +
                companyDefaults.website}
            </Text>
          </View>

          {/* Right: Quote Info */}
          <View style={styles.quoteInfoSection}>
            <Text style={styles.quoteTitle}>ใบเสนอราคา</Text>
            <View style={styles.quoteInfoRow}>
              <Text style={styles.quoteLabel}>เลขที่</Text>
              <Text style={styles.quoteValue}>{order.orderNumber}</Text>
            </View>
            <View style={styles.quoteInfoRow}>
              <Text style={styles.quoteLabel}>วันที่</Text>
              <Text style={styles.quoteValue}>{formatShortDate(order.createdAt)}</Text>
            </View>
            <View style={styles.quoteInfoRow}>
              <Text style={styles.quoteLabel}>ผู้ขาย</Text>
              <Text style={styles.quoteValue}>
                <Text style={styles.quoteLabel}>อริยวัชร ทองสมบูรณ์</Text>
              </Text>
            </View>
            <View style={styles.quoteInfoRow}>
              <Text style={styles.quoteLabel}>โทร</Text>
              <Text style={styles.quoteValue}>
                <Text style={styles.quoteLabel}>081-694-2896 </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Section */}
        <View style={styles.customerSection}>
          <Text style={styles.customerTitle}>ลูกค้า</Text>

          {/* ชื่อลูกค้า */}
          <View style={styles.customerInfoRow}>
            <Text style={styles.customerLabel}>ชื่อ:</Text>
            <Text style={styles.customerValue}>
              {order.customerName}
              {order.customerNickname ? ` (${order.customerNickname})` : ""}
            </Text>
          </View>

          {/* เบอร์โทร */}
          <View style={styles.customerInfoRow}>
            <Text style={styles.customerLabel}>เบอร์โทร:</Text>
            <Text style={styles.customerValue}>{order.customerPhone || "-"}</Text>
          </View>

          {/* อีเมล */}
          <View style={styles.customerInfoRow}>
            <Text style={styles.customerLabel}>อีเมล:</Text>
            <Text style={styles.customerValue}>{order.customerEmail || "-"}</Text>
          </View>

          {/* ที่อยู่จัดส่ง - แสดงเป็นบรรทัดเดียว */}
          {order.shippingAddress && (
            <View style={styles.customerInfoRow}>
              <Text style={styles.customerLabel}>ที่อยู่:</Text>
              <Text style={styles.customerValue}>
                {order.shippingAddress}
                {order.shippingSubDistrict && ` ตำบล/แขวง${order.shippingSubDistrict}`}
                {order.shippingDistrict && ` อำเภอ/เขต${order.shippingDistrict}`}
                {order.shippingProvince && ` จังหวัด${order.shippingProvince}`}
                {order.shippingPostalCode && ` ${order.shippingPostalCode}`}
              </Text>
            </View>
          )}

          {/* ประเภทที่อยู่อาศัย */}
          {order.shippingResidenceType && (
            <View style={styles.customerInfoRow}>
              <Text style={styles.customerLabel}>ประเภทที่อยู่:</Text>
              <Text style={styles.customerValue}>{order.shippingResidenceType} </Text>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: 30 }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "left" }]}>
              รายละเอียด
            </Text>
            <Text style={[styles.tableHeaderCell, { width: 60 }]}>จำนวน </Text>
            <Text style={[styles.tableHeaderCell, { width: 80 }]}>ราคาต่อหน่วย</Text>
            <Text style={[styles.tableHeaderCell, { width: 80 }]}>ยอดรวม</Text>
          </View>

          {/* Table Rows */}
          {groupedItems.map((item, index) => (
            <View key={item.productId}>
              {/* Main Product Row */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: 30, textAlign: "center" }]}>
                  {index + 1}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.productName}</Text>
                <Text style={[styles.tableCell, { width: 60, textAlign: "center" }]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCell, { width: 80, textAlign: "right" }]}>0.00</Text>
                <Text style={[styles.tableCell, { width: 80, textAlign: "right" }]}>0.00</Text>
              </View>

              {/* Paired Products */}
              {item.pairedProducts.length > 0 ? (
                item.pairedProducts.map((paired, pIndex) => (
                  <View key={pIndex} style={styles.pairedRow}>
                    <Text style={[styles.tableCell, { width: 30 }]}></Text>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                      <Text style={styles.treeIcon}>└─</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{paired.name}</Text>
                      <Text style={styles.pairedBadge}>สินค้าที่ใช้คู่กัน</Text>
                    </View>
                    <Text
                      style={[
                        styles.tableCell,
                        { width: 60, textAlign: "center", color: "#666666" },
                      ]}
                    >
                      {paired.quantity}
                    </Text>
                    <Text style={[styles.tableCell, { width: 80, textAlign: "right" }]}>-</Text>
                    <Text style={[styles.tableCell, { width: 80, textAlign: "right" }]}>-</Text>
                  </View>
                ))
              ) : (
                <View>
                  <Text style={styles.noPairedText}>└─ ไม่มีสินค้าที่ใช้คู่กัน</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>รวมเป็นเงิน</Text>
            <Text style={styles.summaryValue}>- บาท </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ภาษีมูลค่าเพิ่ม 7%</Text>
            <Text style={styles.summaryValue}>- บาท</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>จำนวนเงินรวมทั้งสิ้น </Text>
            <Text style={styles.totalValue}>- บาท</Text>
          </View>
          <Text style={styles.totalInWords}></Text>
        </View>

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>หมายเหตุ</Text>
          <Text style={styles.notesText}>
            เมื่อลูกค้าต้องการซื้อสินค้า/บริการ {"\n"}
            กรุณาชำระค่ามัดจำค่าาสินค้า ล็อคคิวติดตั้ง {"\n"}
            เป็นจำนวนเงิน 50% ของยอดทั้งหมด {"\n"}
            งานติดตั้ง/ส่งสินค้า เรียบร้อยแล้ว กรุณาชำระยอดเงินที่เหลือทั้งหมด {"\n"}
            สินค้ารับประกัน 2 ปี (ใช้งานปกติ เสียบปลั๊กตัวใหม่ ใช้งานต่อทันที) {"\n"}*
            งานติดตั้งรวมค่าบริการ Service On site เป็นระยะเวลา 1 ปี
            นับจากวันที่ติดตั้งกับทางบริษัทฯ {"\n"}
          </Text>
        </View>

        {/* Additional Note */}
        <View style={styles.additionalInfo}>
          <Text style={styles.notesBullet}>* ใบเสนอราคา ทุกใบ ยืนยันราคา 15 วัน</Text>
          <Text style={styles.notesBullet}>
            หากเกินกำหนด กรุณาขอใใบเสนอราคาใหม่ จากผู้ขายอีกครั้ง{" "}
          </Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureCompany}>
              ในนาม
              {/* {order.customerName} */}
            </Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>ผู้มีอำนาจ </Text>
            <Text style={styles.signatureDate}>วันที่__________________ </Text>
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signatureCompany}>
              ในนาม บริษัท วิน ซิสเท่ม โซลูชั่น แอนด์ เซอร์วิส จำกัด{" "}
            </Text>

            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>ผู้อนุมัติ</Text>
            <Text style={styles.signatureDate}>วันที่__________________ </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

// API Handler
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
    const pdfBuffer = await renderToBuffer(<QuotationPDF order={order} />)

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quotation-${order.orderNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating quotation PDF:", error)
    return NextResponse.json({ error: "Failed to generate quotation PDF" }, { status: 500 })
  }
}
