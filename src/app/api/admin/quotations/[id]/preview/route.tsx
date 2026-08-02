// app/api/admin/quotations/[id]/preview/route.tsx

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from '@/lib/db'
import { renderToBuffer } from '@react-pdf/renderer'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import path from 'path'
import fs from 'fs'
import { DEFAULT_PDF_NOTES } from '@/features/quotations/components/constants'
import { companyDefaults, PDF_LOGO_RELATIVE_PATH } from "@/config/company"

// Register Thai font
const fontDir = path.join(process.cwd(), 'public', 'fonts')

Font.register({
  family: 'Sarabun',
  fonts: [
    { src: path.join(fontDir, 'Sarabun-Regular.ttf'), fontWeight: 'normal' },
    { src: path.join(fontDir, 'Sarabun-Bold.ttf'), fontWeight: 'bold' },
  ],
})

Font.registerHyphenationCallback(word => [word])

// Styles (simplified for preview)
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Sarabun', fontSize: 10, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#000000' },
  logoSection: { width: 150 },
  logo: { width: 140, height: 'auto' },
  companyInfoSection: { flex: 1, paddingLeft: 15 },
  companyName: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  companyAddress: { fontSize: 8, lineHeight: 1.3 },
  quoteInfoSection: { width: 180 },
  quoteTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  quoteInfoRow: { flexDirection: 'row', marginBottom: 3 },
  quoteLabel: { fontSize: 9, width: 60 },
  quoteValue: { fontSize: 9, flex: 1 },
  customerSection: { marginTop: 12, marginBottom: 15 },
  customerTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  customerInfoRow: { flexDirection: 'row', marginBottom: 3 },
  customerLabel: { fontSize: 9, width: 80 },
  customerValue: { fontSize: 9, flex: 1 },
  table: { marginTop: 15, marginBottom: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#000000', paddingVertical: 6, paddingHorizontal: 4 },
  tableHeaderCell: { fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#cccccc', paddingVertical: 6, paddingHorizontal: 4 },
  tableCell: { fontSize: 9 },
  summarySection: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#000000' },
  summaryRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  summaryLabel: { fontSize: 9, marginRight: 15, width: 150, textAlign: 'right' },
  summaryValue: { fontSize: 9, width: 100, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5, paddingTop: 5, borderTopWidth: 1, borderTopColor: '#cccccc' },
  totalLabel: { fontSize: 10, fontWeight: 'bold', marginRight: 15, width: 150, textAlign: 'right' },
  totalValue: { fontSize: 10, fontWeight: 'bold', width: 100, textAlign: 'right' },
})

// Helpers
const formatShortDate = (date: Date): string => {
  const d = new Date(date)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(amount)
}

// PDF Component
const QuotationPDF = ({ quotation }: { quotation: any }) => {
  const logoPath = path.join(process.cwd(), ...PDF_LOGO_RELATIVE_PATH)
  let logoBuffer = null
  try { logoBuffer = fs.readFileSync(logoPath) } catch (e) {}

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {logoBuffer ? <Image src={logoBuffer} style={styles.logo} /> : <Text>{companyDefaults.nameEn}</Text>}
          </View>
          <View style={styles.companyInfoSection}>
            <Text style={styles.companyName}>{companyDefaults.nameTh}</Text>
            <Text style={styles.companyAddress}>{companyDefaults.address}</Text>
          </View>
          <View style={styles.quoteInfoSection}>
            <Text style={styles.quoteTitle}>ใบเสนอราคา</Text>
            <View style={styles.quoteInfoRow}>
              <Text style={styles.quoteLabel}>เลขที่:</Text>
              <Text style={styles.quoteValue}>{quotation.quotationNumber}</Text>
            </View>
            <View style={styles.quoteInfoRow}>
              <Text style={styles.quoteLabel}>วันที่:</Text>
              <Text style={styles.quoteValue}>{formatShortDate(quotation.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.customerSection}>
          <Text style={styles.customerTitle}>ลูกค้า: {quotation.order.customerName}</Text>
          <View style={styles.customerInfoRow}>
            <Text style={styles.customerLabel}>โทร:</Text>
            <Text style={styles.customerValue}>{quotation.order.customerPhone || '-'}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: 30 }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'left' }]}>รายการ</Text>
            <Text style={[styles.tableHeaderCell, { width: 50 }]}>จำนวน</Text>
            <Text style={[styles.tableHeaderCell, { width: 80 }]}>ราคา</Text>
            <Text style={[styles.tableHeaderCell, { width: 80 }]}>รวม</Text>
          </View>
          {quotation.items.map((item: any, index: number) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: 30, textAlign: 'center' }]}>{index + 1}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{item.productName}</Text>
              <Text style={[styles.tableCell, { width: 50, textAlign: 'center' }]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, { width: 80, textAlign: 'right' }]}>{formatCurrency(Number(item.unitPrice))}</Text>
              <Text style={[styles.tableCell, { width: 80, textAlign: 'right' }]}>{formatCurrency(Number(item.amount))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>รวมเป็นเงิน</Text>
            <Text style={styles.summaryValue}>{formatCurrency(Number(quotation.subtotal))} บาท</Text>
          </View>
          {quotation.includeVat && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>VAT {Number(quotation.vatPercent)}%</Text>
              <Text style={styles.summaryValue}>{formatCurrency(Number(quotation.vatAmount))} บาท</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>รวมทั้งสิ้น</Text>
            <Text style={styles.totalValue}>{formatCurrency(Number(quotation.totalAmount))} บาท</Text>
          </View>
        </View>

        {/* Notes — dynamic */}
        {(() => {
          const notesText = quotation.pdfNotes !== null && quotation.pdfNotes !== undefined
            ? quotation.pdfNotes
            : DEFAULT_PDF_NOTES
          if (!notesText) return null
          return (
            <View style={{ marginTop: 15, marginBottom: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>หมายเหตุ</Text>
              <Text style={{ fontSize: 8, lineHeight: 1.4 }}>{notesText.split('\n').map((l: string) => l + ' ').join('\n')}</Text>
            </View>
          )
        })()}

        {/* Valid days note */}
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 8 }}>* ใบเสนอราคามีอายุ {quotation.validDays} วัน</Text>
          <Text style={{ fontSize: 8 }}>หากเกินกำหนด กรุณาขอใบเสนอราคาใหม่จากผู้ขายอีกครั้ง</Text>
        </View>
      </Page>
    </Document>
  )
}

// API Handler - Return base64
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            customerNickname: true,
            customerEmail: true,
            customerPhone: true,
          },
        },
      },
    })

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    const pdfBuffer = await renderToBuffer(<QuotationPDF quotation={quotation} />)
    const base64 = Buffer.from(pdfBuffer).toString('base64')

    return NextResponse.json({
      success: true,
      pdf: base64,
      filename: `quotation-${quotation.quotationNumber}.pdf`,
    })
  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 })
  }
}