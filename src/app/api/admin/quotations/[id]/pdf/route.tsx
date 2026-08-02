// app/api/admin/quotations/[id]/pdf/route.tsx

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { companyDefaults, PDF_LOGO_RELATIVE_PATH } from "@/config/company"
import { renderToBuffer } from "@react-pdf/renderer"
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"
import path from "path"
import fs from "fs"
import { DEFAULT_PDF_NOTES } from "@/features/quotations/components/constants"
import { pdfTheme } from "@/config/pdf-theme"

// Register Thai font (Sarabun)
const fontDir = path.join(process.cwd(), "public", "fonts")

Font.register({
  family: "Sarabun",
  fonts: [
    { src: path.join(fontDir, "Sarabun-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(fontDir, "Sarabun-Bold.ttf"), fontWeight: "bold" },
    { src: path.join(fontDir, "Sarabun-Medium.ttf"), fontWeight: "medium" },
    { src: path.join(fontDir, "Sarabun-Italic.ttf"), fontStyle: "italic" },
  ],
})

Font.registerHyphenationCallback(word => [word])

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Sarabun",
    fontSize: 10,
    backgroundColor: "#ffffff",
  },
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
  additionalInfo: {
    marginTop: 10,
    fontSize: 8,
    color: "#000000",
  },
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

// Helpers
const formatShortDate = (date: Date): string => {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, "0")
  const month = (d.getMonth() + 1).toString().padStart(2, "0")
  const year = d.getFullYear() + 543
  return `${day}/${month}/${year}`
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Types
interface GroupedItem {
  mainItem: any
  pairedItems: any[]
}

// PDF Component
const QuotationPDF = ({
  quotation,
  companySettings,
  seller,
}: {
  quotation: any
  companySettings: {
    companyNameTh: string
    companyNameEn: string
    address: string
    taxId: string
    phone: string
    website: string
  }
  seller: { name: string; phone: string } | null
}) => {
  // Load logo
  const logoPath = path.join(process.cwd(), ...PDF_LOGO_RELATIVE_PATH)
  let logoBuffer = null

  try {
    logoBuffer = fs.readFileSync(logoPath)
  } catch (error) {
    // ไม่มีไฟล์โลโก้ก็ไม่เป็นไร — จะพิมพ์ชื่อบริษัทเป็นข้อความแทน
  }

  // Group items
  const groupedItems: GroupedItem[] = []
  const mainItems = quotation.items.filter((i: any) => !i.isPairedProduct)

  mainItems.forEach((mainItem: any) => {
    const pairedItems = quotation.items.filter(
      (i: any) => i.isPairedProduct && i.pairedWithIndex === mainItem.sortOrder
    )
    groupedItems.push({ mainItem, pairedItems })
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {logoBuffer ? (
              <Image src={logoBuffer} style={styles.logo} />
            ) : (
              <Text>Logo</Text>
            )}
          </View>

          <View style={styles.companyInfoSection}>
            <Text style={styles.companyName}>
              {companySettings.companyNameTh + " "}
            </Text>
            <Text style={styles.companyNameEng}>
              {companySettings.companyNameEn + " "}
            </Text>
            <Text style={styles.companyAddress}>
              {companySettings.address + " "}{"\n"}
              {"เลขประจำตัวผู้เสียภาษี " + companySettings.taxId + " "}{"\n"}
              {"โทร " + companySettings.phone + " "}{"\n"}
              {companySettings.website + " "}
            </Text>
          </View>

          <View style={styles.quoteInfoSection}>
            <Text style={styles.quoteTitle}>ใบเสนอราคา</Text>
            <View style={styles.quoteInfoRow}>
              <Text style={styles.quoteLabel}>เลขที่</Text>
              <Text style={styles.quoteValue}>{quotation.quotationNumber}</Text>
            </View>
            <View style={styles.quoteInfoRow}>
              <Text style={styles.quoteLabel}>วันที่</Text>
              <Text style={styles.quoteValue}>
                {formatShortDate(quotation.createdAt)}
              </Text>
            </View>
            <View style={styles.quoteInfoRow}>
              <Text style={styles.quoteLabel}>ผู้ขาย</Text>
              <Text style={styles.quoteValue}>{(seller?.name ?? "-") + " "}</Text>
            </View>
            <View style={styles.quoteInfoRow}>
              <Text style={styles.quoteLabel}>โทร</Text>
              <Text style={styles.quoteValue}>{(seller?.phone ?? "-") + " "}</Text>
            </View>
          </View>
        </View>

        {/* Customer Section */}
        <View style={styles.customerSection}>
          <Text style={styles.customerTitle}>ลูกค้า</Text>

          <View style={styles.customerInfoRow}>
            <Text style={styles.customerLabel}>ชื่อ:</Text>
            <Text style={styles.customerValue}>
              {quotation.order.customerName}
              {quotation.order.customerNickname
                ? ` (${quotation.order.customerNickname})`
                : ""}
            </Text>
          </View>

          <View style={styles.customerInfoRow}>
            <Text style={styles.customerLabel}>เบอร์โทร:</Text>
            <Text style={styles.customerValue}>
              {quotation.order.customerPhone || "-"}
            </Text>
          </View>

          <View style={styles.customerInfoRow}>
            <Text style={styles.customerLabel}>อีเมล:</Text>
            <Text style={styles.customerValue}>
              {quotation.order.customerEmail || "-"}
            </Text>
          </View>

          {quotation.order.shippingAddress && (
            <View style={styles.customerInfoRow}>
              <Text style={styles.customerLabel}>ที่อยู่:</Text>
              <Text style={styles.customerValue}>
                {quotation.order.shippingAddress}
                {quotation.order.shippingSubDistrict &&
                  ` ต.${quotation.order.shippingSubDistrict}`}
                {quotation.order.shippingDistrict &&
                  ` อ.${quotation.order.shippingDistrict}`}
                {quotation.order.shippingProvince &&
                  ` จ.${quotation.order.shippingProvince}`}
                {quotation.order.shippingPostalCode &&
                  ` ${quotation.order.shippingPostalCode}`}
              </Text>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: 30 }]}>#</Text>
            <Text
              style={[styles.tableHeaderCell, { flex: 1, textAlign: "left" }]}
            >
              รายละเอียด
            </Text>
            <Text style={[styles.tableHeaderCell, { width: 60 }]}>จำนวน </Text>
            <Text style={[styles.tableHeaderCell, { width: 80 }]}>
              ราคาต่อหน่วย
            </Text>
            <Text style={[styles.tableHeaderCell, { width: 80 }]}>ยอดรวม</Text>
          </View>

          {groupedItems.map((group, index) => (
            <View key={group.mainItem.id}>
              {/* Main Product */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: 30, textAlign: "center" }]}>
                  {index + 1}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {group.mainItem.productName}
                </Text>
                <Text style={[styles.tableCell, { width: 60, textAlign: "center" }]}>
                  {group.mainItem.quantity}
                </Text>
                <Text style={[styles.tableCell, { width: 80, textAlign: "right" }]}>
                  {formatCurrency(Number(group.mainItem.unitPrice))}
                </Text>
                <Text style={[styles.tableCell, { width: 80, textAlign: "right" }]}>
                  {formatCurrency(Number(group.mainItem.amount))}
                </Text>
              </View>

              {/* Paired Products */}
              {group.pairedItems.length > 0 ? (
                group.pairedItems.map((paired: any) => (
                  <View key={paired.id} style={styles.pairedRow}>
                    <Text style={[styles.tableCell, { width: 30 }]}></Text>
                    <View
                      style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
                    >
                      <Text style={styles.treeIcon}>└─</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>
                        {paired.productName}
                      </Text>
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
                    <Text style={[styles.tableCell, { width: 80, textAlign: "right" }]}>
                      {formatCurrency(Number(paired.unitPrice))}
                    </Text>
                    <Text style={[styles.tableCell, { width: 80, textAlign: "right" }]}>
                      {formatCurrency(Number(paired.amount))}
                    </Text>
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
            <Text style={styles.summaryValue}>
              {formatCurrency(Number(quotation.subtotal))} บาท
            </Text>
          </View>
          {quotation.includeVat && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                ภาษีมูลค่าเพิ่ม {Number(quotation.vatPercent)}%
              </Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(Number(quotation.vatAmount))} บาท
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>จำนวนเงินรวมทั้งสิ้น </Text>
            <Text style={styles.totalValue}>
              {formatCurrency(Number(quotation.totalAmount))} บาท
            </Text>
          </View>
        </View>

        {/* Notes — dynamic (null=template, ""=none, text=custom) */}
        {(() => {
          const notesText = quotation.pdfNotes !== null && quotation.pdfNotes !== undefined
            ? quotation.pdfNotes
            : DEFAULT_PDF_NOTES
          if (!notesText) return null
          return (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>หมายเหตุ</Text>
              <Text style={styles.notesText}>{notesText.split('\n').map((l: string) => l + ' ').join('\n')}</Text>
            </View>
          )
        })()}

        {/* Additional */}
        <View style={styles.additionalInfo}>
          <Text style={styles.notesBullet}>
            * ใบเสนอราคามีอายุ {quotation.validDays} วัน
          </Text>
          <Text style={styles.notesBullet}>
            หากเกินกำหนด กรุณาขอใบเสนอราคาใหม่จากผู้ขายอีกครั้ง </Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureCompany}>ในนาม</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>ผู้มีอำนาจ </Text>
            <Text style={styles.signatureDate}>วันที่__________________</Text>
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signatureCompany}>
              {"ในนาม " + companySettings.companyNameTh + " "}
            </Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>ผู้อนุมัติ</Text>
            <Text style={styles.signatureDate}>วันที่__________________</Text>
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
    return NextResponse.json(
      { error: "Failed to generate quotation PDF" },
      { status: 500 }
    )
  }
}