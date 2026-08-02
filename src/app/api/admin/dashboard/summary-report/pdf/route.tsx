// app/api/admin/dashboard/summary-report/pdf/route.tsx

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/api/guards"
import { renderToBuffer } from '@react-pdf/renderer';
import {
  Document,
  Page,
  Text,
  View,
  pdfStyles,
  formatThaiDate,
  StyleSheet,
} from '@/lib/pdf';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { calculateSummaryReport, parseDateParams } from '@/features/dashboard/report-data';
import type { ReportData } from '@/features/dashboard/summary-report.types';

// Issue category labels
const ISSUE_CATEGORY_LABELS: Record<string, string> = {
  BOOKING: 'การจอง',
  PAYMENT: 'การชำระเงิน ',
  USAGE_ISSUE: 'ปัญหาการใช้งาน ',
  ACCOUNT: 'บัญชีผู้ใช้ ',
  OTHER: 'อื่นๆ ',
};

// Member type labels
const MEMBER_TYPE_LABELS: Record<string, string> = {
  customer: 'ลูกค้าทั่วไป',
  contractor: 'ผู้รับเหมา',
  dealer: 'ตัวแทนจำหน่าย',
  other: 'อื่นๆ',
};

// Additional styles for summary report
const reportStyles = StyleSheet.create({
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  statTrend: {
    fontSize: 8,
    marginTop: 2,
  },
  trendPositive: {
    color: '#22c55e',
  },
  trendNegative: {
    color: '#ef4444',
  },
  trendNeutral: {
    color: '#6b7280',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    fontSize: 9,
  },
  listNumber: {
    width: 20,
    color: '#666666',
  },
  listContent: {
    flex: 1,
    color: '#333333',
  },
  listValue: {
    width: 80,
    textAlign: 'right',
    fontWeight: 'bold',
    color: '#000000',
  },
  noteBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 4,
  },
  noteTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#92400e',
  },
  noteText: {
    fontSize: 8,
    color: '#78350f',
    marginBottom: 2,
  },
  smallStatCard: {
    width: '31%',
    backgroundColor: '#f5f5f5',
    padding: 6,
    borderRadius: 4,
  },
  smallStatLabel: {
    fontSize: 7,
    color: '#666666',
    marginBottom: 2,
  },
  smallStatValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333333',
  },
});

// Format date as Thai Buddhist Era (พ.ศ.)
function formatThaiBEDate(date: Date): string {
  return `${format(date, 'd MMMM', { locale: th })} ${date.getFullYear() + 543}`;
}

// Summary Report PDF Component
const SummaryReportPDF = ({ data }: { data: ReportData }) => {
  const startDate = formatThaiBEDate(new Date(data.dateRange.start));
  const endDate = formatThaiBEDate(new Date(data.dateRange.end));

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.headerTitle}>NINEBOOKING</Text>
          <Text style={pdfStyles.headerSubtitle}>รายงานสรุปภาพรวมระบบจองสินค้า</Text>
          <Text style={{ fontSize: 8, color: '#666666', marginTop: 5 }}>
            ช่วงเวลา: {startDate} - {endDate}
          </Text>
          <Text style={{ fontSize: 8, color: '#666666' }}>
            ข้อมูล ณ วันที่: {formatThaiBEDate(new Date(data.generatedAt))}
          </Text>
        </View>

        {/* Section 1: สถิติรวมทั้งหมด */}
        <View style={reportStyles.section}>
          <Text style={reportStyles.sectionTitle}>1. สถิติรวมทั้งหมด (ตลอดกาล)</Text>

          <View style={reportStyles.statsGrid}>
            <View style={reportStyles.statCard}>
              <Text style={reportStyles.statLabel}>สมาชิกทั้งหมด</Text>
              <Text style={reportStyles.statValue}>{data.totalMembers.toLocaleString()} คน</Text>
            </View>

            <View style={reportStyles.statCard}>
              <Text style={reportStyles.statLabel}>คำสั่งจองทั้งหมด </Text>
              <Text style={reportStyles.statValue}>{data.totalOrders.toLocaleString()} รายการ</Text>
            </View>

            <View style={reportStyles.statCard}>
              <Text style={reportStyles.statLabel}>ยอดเข้าชมทั้งหมด</Text>
              <Text style={reportStyles.statValue}>{data.totalViews.toLocaleString()} ครั้ง</Text>
            </View>
          </View>
        </View>

        {/* Section 2: สถิติในช่วงเวลาที่เลือก */}
        <View style={reportStyles.section}>
          <Text style={reportStyles.sectionTitle}>2. สถิติในช่วงเวลาที่เลือก ({startDate} - {endDate})</Text>

          <View style={reportStyles.statsGrid}>
            <View style={reportStyles.statCard}>
              <Text style={reportStyles.statLabel}>จองในช่วงที่เลือก</Text>
              <Text style={reportStyles.statValue}>{data.currentPeriodOrders.toLocaleString()} รายการ</Text>
              <Text style={[
                reportStyles.statTrend,
                data.orderTrend > 0 ? reportStyles.trendPositive :
                data.orderTrend < 0 ? reportStyles.trendNegative :
                reportStyles.trendNeutral
              ]}>
                {data.orderTrend > 0 ? '+' : ''}{data.orderTrend}% จากช่วงก่อนหน้า
              </Text>
            </View>

            <View style={reportStyles.statCard}>
              <Text style={reportStyles.statLabel}>ชมในช่วงที่เลือก</Text>
              <Text style={reportStyles.statValue}>{data.currentPeriodViews.toLocaleString()} ครั้ง</Text>
              <Text style={[
                reportStyles.statTrend,
                data.viewTrend > 0 ? reportStyles.trendPositive :
                data.viewTrend < 0 ? reportStyles.trendNegative :
                reportStyles.trendNeutral
              ]}>
                {data.viewTrend > 0 ? '+' : ''}{data.viewTrend}% จากช่วงก่อนหน้า
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: การจัดการคำสั่งจอง */}
        <View style={reportStyles.section}>
          <Text style={reportStyles.sectionTitle}>3. การจัดการคำสั่งจอง (แยกตามสถานะ)</Text>

          <View style={reportStyles.statsGrid}>
            <View style={[reportStyles.statCard, { backgroundColor: '#fef3c7' }]}>
              <Text style={reportStyles.statLabel}>รอดำเนินการ (PENDING)</Text>
              <Text style={reportStyles.statValue}>{data.pendingOrders.toLocaleString()}</Text>
              <Text style={{ fontSize: 7, color: '#92400e' }}>
                {data.currentPeriodOrders > 0
                  ? `${((data.pendingOrders / data.currentPeriodOrders) * 100).toFixed(1)}%`
                  : '0%'}
              </Text>
            </View>

            <View style={[reportStyles.statCard, { backgroundColor: '#dbeafe' }]}>
              <Text style={reportStyles.statLabel}>ยืนยันแล้ว (CONFIRMED)</Text>
              <Text style={reportStyles.statValue}>{data.confirmedOrders.toLocaleString()}</Text>
              <Text style={{ fontSize: 7, color: '#1e40af' }}>
                {data.currentPeriodOrders > 0
                  ? `${((data.confirmedOrders / data.currentPeriodOrders) * 100).toFixed(1)}%`
                  : '0%'}
              </Text>
            </View>

            <View style={[reportStyles.statCard, { backgroundColor: '#d1fae5' }]}>
              <Text style={reportStyles.statLabel}>เสร็จสิ้น (COMPLETED)</Text>
              <Text style={reportStyles.statValue}>{data.completedOrders.toLocaleString()}</Text>
              <Text style={{ fontSize: 7, color: '#065f46' }}>
                {data.currentPeriodOrders > 0
                  ? `${((data.completedOrders / data.currentPeriodOrders) * 100).toFixed(1)}%`
                  : '0%'}
              </Text>
            </View>

            <View style={[reportStyles.statCard, { backgroundColor: '#fee2e2' }]}>
              <Text style={reportStyles.statLabel}>ยกเลิก (CANCELLED)</Text>
              <Text style={reportStyles.statValue}>{data.cancelledOrders.toLocaleString()}</Text>
              <Text style={{ fontSize: 7, color: '#991b1b' }}>
                {data.currentPeriodOrders > 0
                  ? `${((data.cancelledOrders / data.currentPeriodOrders) * 100).toFixed(1)}%`
                  : '0%'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 4: วิเคราะห์ตามหมวดหมู่สินค้า */}
        <View style={reportStyles.section}>
          <Text style={reportStyles.sectionTitle}>4. วิเคราะห์ตามหมวดหมู่สินค้า (Top 5)</Text>

          {data.categoryStats && data.categoryStats.length > 0 ? (
            data.categoryStats.map((cat, index) => (
              <View key={index} style={reportStyles.listItem}>
                <Text style={reportStyles.listNumber}>{index + 1}.</Text>
                <Text style={reportStyles.listContent}>{cat.categoryName}</Text>
                <Text style={reportStyles.listValue}>
                  จอง: {cat.orderCount} ({cat.orderPercentage}%)
                </Text>
                <Text style={reportStyles.listValue}>
                  ชม: {cat.viewCount} ({cat.viewPercentage}%)
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 9, color: '#666666' }}>ไม่พบข้อมูลหมวดหมู่</Text>
          )}
        </View>

        {/* Section 5: สินค้ายอดนิยม */}
        <View style={reportStyles.section}>
          <Text style={reportStyles.sectionTitle}>5. สินค้ายอดนิยม (Top 5)</Text>

          <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>
            สินค้าที่ถูกจองมากที่สุด
          </Text>
          {data.topProductsByOrders && data.topProductsByOrders.length > 0 ? (
            data.topProductsByOrders.map((product, index) => (
              <View key={index} style={reportStyles.listItem}>
                <Text style={reportStyles.listNumber}>{index + 1}.</Text>
                <Text style={reportStyles.listContent}>{product.name}</Text>
                <Text style={reportStyles.listValue}>
                  {product.orderCount?.toLocaleString()} รายการ
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 9, color: '#666666', marginBottom: 10 }}>ไม่พบข้อมูล</Text>
          )}

          <Text style={{ fontSize: 10, fontWeight: 'bold', marginTop: 8, marginBottom: 5 }}>
            สินค้าที่ได้รับความสนใจสูงสุด
          </Text>
          {data.topProductsByViews && data.topProductsByViews.length > 0 ? (
            data.topProductsByViews.map((product, index) => (
              <View key={index} style={reportStyles.listItem}>
                <Text style={reportStyles.listNumber}>{index + 1}.</Text>
                <Text style={reportStyles.listContent}>{product.name}</Text>
                <Text style={reportStyles.listValue}>
                  {product.viewCount?.toLocaleString()} ครั้ง
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 9, color: '#666666' }}>ไม่พบข้อมูล</Text>
          )}
        </View>

        {/* Section 6: ปัญหา/แจ้งเรื่อง */}
        <View style={reportStyles.section}>
          <Text style={reportStyles.sectionTitle}>6. สรุปปัญหา/แจ้งเรื่อง </Text>

          <View style={reportStyles.statsGrid}>
            <View style={reportStyles.smallStatCard}>
              <Text style={reportStyles.smallStatLabel}>ปัญหาทั้งหมด </Text>
              <Text style={reportStyles.smallStatValue}>{data.contactIssueStats.totalIssues.toLocaleString()}</Text>
            </View>
            <View style={reportStyles.smallStatCard}>
              <Text style={reportStyles.smallStatLabel}>ในช่วงที่เลือก </Text>
              <Text style={reportStyles.smallStatValue}>{data.contactIssueStats.issuesInPeriod.toLocaleString()}</Text>
            </View>
            <View style={reportStyles.smallStatCard}>
              <Text style={reportStyles.smallStatLabel}>รอดำเนินการ </Text>
              <Text style={reportStyles.smallStatValue}>{data.contactIssueStats.pendingIssues.toLocaleString()}</Text>
            </View>
          </View>

          {data.contactIssueStats.issuesByCategory.length > 0 && (
            <View style={{ marginTop: 5 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4, color: '#333333' }}>
                แยกตามประเภท (ในช่วงที่เลือก)
              </Text>
              {data.contactIssueStats.issuesByCategory.map((item, index) => (
                <View key={index} style={reportStyles.listItem}>
                  <Text style={reportStyles.listNumber}>{index + 1}.</Text>
                  <Text style={reportStyles.listContent}>
                    {ISSUE_CATEGORY_LABELS[item.category] || item.category}
                  </Text>
                  <Text style={reportStyles.listValue}>{item.count} เรื่อง</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section 7: สมาชิก */}
        <View style={reportStyles.section}>
          <Text style={reportStyles.sectionTitle}>7. สมาชิก</Text>

          <View style={reportStyles.statsGrid}>
            <View style={reportStyles.statCard}>
              <Text style={reportStyles.statLabel}>สมาชิกใหม่ในช่วงที่เลือก</Text>
              <Text style={reportStyles.statValue}>{data.memberGrowthStats.newMembersInPeriod.toLocaleString()} คน</Text>
              <Text style={[
                reportStyles.statTrend,
                data.memberGrowthStats.memberGrowthTrend > 0 ? reportStyles.trendPositive :
                data.memberGrowthStats.memberGrowthTrend < 0 ? reportStyles.trendNegative :
                reportStyles.trendNeutral
              ]}>
                {data.memberGrowthStats.memberGrowthTrend > 0 ? '+' : ''}{data.memberGrowthStats.memberGrowthTrend}% จากช่วงก่อนหน้า
              </Text>
            </View>

            <View style={reportStyles.statCard}>
              <Text style={reportStyles.statLabel}>สมาชิกทั้งหมด</Text>
              <Text style={reportStyles.statValue}>{data.totalMembers.toLocaleString()} คน</Text>
            </View>
          </View>

          {data.memberGrowthStats.membersByType.length > 0 && (
            <View style={{ marginTop: 5 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4, color: '#333333' }}>
                แยกตามประเภทสมาชิก
              </Text>
              {data.memberGrowthStats.membersByType.map((item, index) => (
                <View key={index} style={reportStyles.listItem}>
                  <Text style={reportStyles.listNumber}>{index + 1}.</Text>
                  <Text style={reportStyles.listContent}>
                    {MEMBER_TYPE_LABELS[item.memberType] || item.memberType}
                  </Text>
                  <Text style={reportStyles.listValue}>{item.count.toLocaleString()} คน</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={reportStyles.noteBox}>
          <Text style={reportStyles.noteTitle}>หมายเหตุ</Text>
          <Text style={reportStyles.noteText}>
            • ข้อมูลในรายงานนี้เป็นข้อมูล ณ เวลาที่สร้างรายงาน และอาจมีการเปลี่ยนแปลงแบบเรียลไทม์
          </Text>
          <Text style={reportStyles.noteText}>
            • เปอร์เซ็นต์แนวโน้มคำนวณจากการเปรียบเทียบกับช่วงเวลาก่อนหน้า
          </Text>
          <Text style={reportStyles.noteText}>
            • สถิติหมวดหมู่และสินค้ายอดนิยมแสดงเฉพาะ Top 5 เท่านั้น
          </Text>
          <Text style={reportStyles.noteText}>
            • ยอดเข้าชมนับรวมทั้งสมาชิกและผู้เยี่ยมชมทั่วไป
          </Text>
        </View>

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          เอกสารนี้ออกโดยระบบ NineBooking | วันที่พิมพ์: {formatThaiDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
};

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Missing parameters', details: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    let params;
    try {
      params = parseDateParams(startDateStr, endDateStr);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400 }
      );
    }

    const reportData = await calculateSummaryReport(params);

    const pdfBuffer = await renderToBuffer(
      <SummaryReportPDF data={reportData} />
    );

    const dateStr = format(params.currentStart, 'yyyyMMdd');
    const endStr = format(params.currentEnd, 'yyyyMMdd');
    const filename = `summary-report-${dateStr}-${endStr}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[PDF API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
