// app/api/admin/dashboard/summary-report/excel/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/api/guards"
import { calculateSummaryReport, parseDateParams } from '@/features/dashboard/report-data';
import {
  createWorkbook,
  addTitleRow,
  addSubtitleRow,
  styleHeaderRow,
  styleDataRow,
  autoFitColumns,
  generateExcelBuffer,
} from '@/lib/excel';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const ISSUE_CATEGORY_LABELS: Record<string, string> = {
  BOOKING: 'การจอง',
  PAYMENT: 'การชำระเงิน',
  USAGE_ISSUE: 'ปัญหาการใช้งาน',
  ACCOUNT: 'บัญชีผู้ใช้',
  OTHER: 'อื่นๆ',
};

const MEMBER_TYPE_LABELS: Record<string, string> = {
  customer: 'ลูกค้าทั่วไป',
  contractor: 'ผู้รับเหมา',
  dealer: 'ตัวแทนจำหน่าย',
  other: 'อื่นๆ',
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

    const data = await calculateSummaryReport(params);

    // Format as Thai Buddhist Era (พ.ศ.)
    const toBEDate = (d: Date) => `${format(d, 'd MMMM', { locale: th })} ${d.getFullYear() + 543}`;

    const startDateFormatted = toBEDate(new Date(data.dateRange.start));
    const endDateFormatted = toBEDate(new Date(data.dateRange.end));
    const generatedAtFormatted = toBEDate(new Date(data.generatedAt));
    const dateRangeText = `ช่วงเวลา: ${startDateFormatted} - ${endDateFormatted}`;
    const generatedAtText = `ข้อมูล ณ วันที่: ${generatedAtFormatted}`;

    const workbook = createWorkbook();

    // =============================================
    // Sheet 1: ภาพรวม
    // =============================================
    const sheet1 = workbook.addWorksheet('ภาพรวม');
    addTitleRow(sheet1, 'รายงานสรุปภาพรวมระบบจองสินค้า NineBooking', 3);
    addSubtitleRow(sheet1, dateRangeText, 3);
    addSubtitleRow(sheet1, generatedAtText, 3);
    sheet1.addRow([]);

    // Section A: All-time totals
    const allTimeTitle = sheet1.addRow(['สถิติรวมทั้งหมด (ตลอดกาล)', '', '']);
    allTimeTitle.getCell(1).font = { bold: true, size: 11 };
    sheet1.addRow([]);

    const allTimeHeaders = sheet1.addRow(['รายการ', 'จำนวน', 'หน่วย']);
    styleHeaderRow(allTimeHeaders);

    const allTimeData = [
      ['สมาชิกทั้งหมด', data.totalMembers, 'คน'],
      ['สินค้าทั้งหมด (Active)', data.totalProducts, 'รายการ'],
      ['หมวดหมู่ทั้งหมด (Active)', data.totalCategories, 'หมวดหมู่'],
      ['คำสั่งจองทั้งหมด', data.totalOrders, 'รายการ'],
      ['ยอดเข้าชมทั้งหมด', data.totalViews, 'ครั้ง'],
    ];

    allTimeData.forEach((row, i) => {
      const r = sheet1.addRow(row);
      styleDataRow(r, i % 2 === 0);
    });

    sheet1.addRow([]);

    // Section B: Period stats
    const periodTitle = sheet1.addRow(['สถิติช่วงเวลาที่เลือก', '', '']);
    periodTitle.getCell(1).font = { bold: true, size: 11 };
    sheet1.addRow([]);

    const periodHeaders = sheet1.addRow(['รายการ', 'จำนวน', 'หน่วย/หมายเหตุ']);
    styleHeaderRow(periodHeaders);

    const periodData = [
      ['จองในช่วงที่เลือก', data.currentPeriodOrders, 'รายการ'],
      ['เข้าชมในช่วงที่เลือก', data.currentPeriodViews, 'ครั้ง'],
      ['แนวโน้มคำสั่งจอง', `${data.orderTrend > 0 ? '+' : ''}${data.orderTrend}%`, data.dateRange.comparisonLabel],
      ['แนวโน้มยอดเข้าชม', `${data.viewTrend > 0 ? '+' : ''}${data.viewTrend}%`, data.dateRange.comparisonLabel],
    ];

    periodData.forEach((row, i) => {
      const r = sheet1.addRow(row);
      styleDataRow(r, i % 2 === 0);
    });

    autoFitColumns(sheet1);

    // =============================================
    // Sheet 2: คำสั่งจอง
    // =============================================
    const sheet2 = workbook.addWorksheet('คำสั่งจอง');
    addTitleRow(sheet2, 'สถิติคำสั่งจอง', 4);
    addSubtitleRow(sheet2, dateRangeText, 4);
    addSubtitleRow(sheet2, generatedAtText, 4);
    sheet2.addRow([]);

    // Status breakdown
    const statusHeaders = sheet2.addRow(['สถานะ', 'จำนวน', 'เปอร์เซ็นต์', 'สถานะ (EN)']);
    styleHeaderRow(statusHeaders);

    const statusData = [
      { label: 'รอดำเนินการ', count: data.pendingOrders, en: 'PENDING' },
      { label: 'ยืนยันแล้ว', count: data.confirmedOrders, en: 'CONFIRMED' },
      { label: 'เสร็จสิ้น', count: data.completedOrders, en: 'COMPLETED' },
      { label: 'ยกเลิก', count: data.cancelledOrders, en: 'CANCELLED' },
    ];

    statusData.forEach((item, i) => {
      const pct = data.currentPeriodOrders > 0
        ? `${((item.count / data.currentPeriodOrders) * 100).toFixed(1)}%`
        : '0%';
      const r = sheet2.addRow([item.label, item.count, pct, item.en]);
      styleDataRow(r, i % 2 === 0);
    });

    sheet2.addRow([]);
    sheet2.addRow([`รวมในช่วงที่เลือก: ${data.currentPeriodOrders} รายการ`]);

    // Monthly stats
    sheet2.addRow([]);
    const monthlyTitle = sheet2.addRow(['สถิติรายเดือน (12 เดือนย้อนหลัง)']);
    monthlyTitle.getCell(1).font = { bold: true, size: 12 };
    sheet2.addRow([]);

    const monthlyHeaders = sheet2.addRow(['เดือน', 'คำสั่งจอง', 'ยอดเข้าชม']);
    styleHeaderRow(monthlyHeaders);

    data.monthlyStats.forEach((month, i) => {
      const r = sheet2.addRow([month.month, month.orders, month.views]);
      styleDataRow(r, i % 2 === 0);
    });

    autoFitColumns(sheet2);

    // =============================================
    // Sheet 3: หมวดหมู่
    // =============================================
    const sheet3 = workbook.addWorksheet('หมวดหมู่');
    addTitleRow(sheet3, 'วิเคราะห์ตามหมวดหมู่สินค้า (Top 5)', 6);
    addSubtitleRow(sheet3, dateRangeText, 6);
    addSubtitleRow(sheet3, generatedAtText, 6);
    sheet3.addRow([]);

    const catHeaders = sheet3.addRow(['อันดับ', 'หมวดหมู่', 'จำนวนจอง', '% จากคำสั่งจอง', 'ยอดเข้าชม', '% จากยอดชม']);
    styleHeaderRow(catHeaders);

    data.categoryStats.forEach((cat, i) => {
      const r = sheet3.addRow([
        i + 1,
        cat.categoryName,
        cat.orderCount,
        `${cat.orderPercentage}%`,
        cat.viewCount,
        `${cat.viewPercentage}%`,
      ]);
      styleDataRow(r, i % 2 === 0);
    });

    if (data.categoryStats.length === 0) {
      sheet3.addRow(['', 'ไม่พบข้อมูล', '', '', '', '']);
    }

    autoFitColumns(sheet3);

    // =============================================
    // Sheet 4: สินค้า
    // =============================================
    const sheet4 = workbook.addWorksheet('สินค้า');
    addTitleRow(sheet4, 'สินค้ายอดนิยม (Top 5)', 3);
    addSubtitleRow(sheet4, dateRangeText, 3);
    addSubtitleRow(sheet4, generatedAtText, 3);
    sheet4.addRow([]);

    // Top by orders
    const orderProductTitle = sheet4.addRow(['สินค้าที่ถูกจองมากที่สุด']);
    orderProductTitle.getCell(1).font = { bold: true, size: 12 };
    sheet4.addRow([]);

    const orderProductHeaders = sheet4.addRow(['อันดับ', 'ชื่อสินค้า', 'จำนวนจอง']);
    styleHeaderRow(orderProductHeaders);

    data.topProductsByOrders.forEach((product, i) => {
      const r = sheet4.addRow([i + 1, product.name, product.orderCount || 0]);
      styleDataRow(r, i % 2 === 0);
    });

    sheet4.addRow([]);

    // Top by views
    const viewProductTitle = sheet4.addRow(['สินค้าที่ได้รับความสนใจสูงสุด']);
    viewProductTitle.getCell(1).font = { bold: true, size: 12 };
    sheet4.addRow([]);

    const viewProductHeaders = sheet4.addRow(['อันดับ', 'ชื่อสินค้า', 'ยอดเข้าชม']);
    styleHeaderRow(viewProductHeaders);

    data.topProductsByViews.forEach((product, i) => {
      const r = sheet4.addRow([i + 1, product.name, product.viewCount || 0]);
      styleDataRow(r, i % 2 === 0);
    });

    autoFitColumns(sheet4);

    // =============================================
    // Sheet 5: ปัญหา/แจ้งเรื่อง
    // =============================================
    const sheet5 = workbook.addWorksheet('ปัญหา-แจ้งเรื่อง');
    addTitleRow(sheet5, 'สรุปปัญหา/แจ้งเรื่อง', 3);
    addSubtitleRow(sheet5, dateRangeText, 3);
    addSubtitleRow(sheet5, generatedAtText, 3);
    sheet5.addRow([]);

    const issueHeaders = sheet5.addRow(['รายการ', 'จำนวน', 'หมายเหตุ']);
    styleHeaderRow(issueHeaders);

    const issueData = [
      ['ปัญหาทั้งหมด', data.contactIssueStats.totalIssues, 'สะสมทั้งหมด'],
      ['ในช่วงที่เลือก', data.contactIssueStats.issuesInPeriod, dateRangeText],
      ['รอดำเนินการ (PENDING)', data.contactIssueStats.pendingIssues, 'ปัจจุบัน'],
      ['กำลังดำเนินการ (IN_PROGRESS)', data.contactIssueStats.inProgressIssues, 'ปัจจุบัน'],
      ['ปิดแล้วในช่วงที่เลือก', data.contactIssueStats.closedIssuesInPeriod, dateRangeText],
    ];

    issueData.forEach((row, i) => {
      const r = sheet5.addRow(row);
      styleDataRow(r, i % 2 === 0);
    });

    if (data.contactIssueStats.issuesByCategory.length > 0) {
      sheet5.addRow([]);
      const catTitle = sheet5.addRow(['แยกตามประเภทปัญหา (ในช่วงที่เลือก)']);
      catTitle.getCell(1).font = { bold: true, size: 12 };
      sheet5.addRow([]);

      const issueCatHeaders = sheet5.addRow(['ประเภท', 'จำนวน', 'เปอร์เซ็นต์']);
      styleHeaderRow(issueCatHeaders);

      data.contactIssueStats.issuesByCategory.forEach((item, i) => {
        const pct = data.contactIssueStats.issuesInPeriod > 0
          ? `${((item.count / data.contactIssueStats.issuesInPeriod) * 100).toFixed(1)}%`
          : '0%';
        const r = sheet5.addRow([
          ISSUE_CATEGORY_LABELS[item.category] || item.category,
          item.count,
          pct,
        ]);
        styleDataRow(r, i % 2 === 0);
      });
    }

    autoFitColumns(sheet5);

    // =============================================
    // Sheet 6: สมาชิก
    // =============================================
    const sheet6 = workbook.addWorksheet('สมาชิก');
    addTitleRow(sheet6, 'สถิติสมาชิก', 3);
    addSubtitleRow(sheet6, dateRangeText, 3);
    addSubtitleRow(sheet6, generatedAtText, 3);
    sheet6.addRow([]);

    const memberHeaders = sheet6.addRow(['รายการ', 'จำนวน', 'หมายเหตุ']);
    styleHeaderRow(memberHeaders);

    const trendText = `${data.memberGrowthStats.memberGrowthTrend > 0 ? '+' : ''}${data.memberGrowthStats.memberGrowthTrend}% ${data.dateRange.comparisonLabel}`;

    const memberData = [
      ['สมาชิกทั้งหมด', data.totalMembers, 'ผู้ใช้งาน (ไม่รวม Admin)'],
      ['สมาชิกใหม่ในช่วงที่เลือก', data.memberGrowthStats.newMembersInPeriod, trendText],
      ['สมาชิกใหม่ช่วงก่อนหน้า', data.memberGrowthStats.newMembersComparePeriod, data.dateRange.comparisonLabel],
    ];

    memberData.forEach((row, i) => {
      const r = sheet6.addRow(row);
      styleDataRow(r, i % 2 === 0);
    });

    if (data.memberGrowthStats.membersByType.length > 0) {
      sheet6.addRow([]);
      const typeTitle = sheet6.addRow(['แยกตามประเภทสมาชิก']);
      typeTitle.getCell(1).font = { bold: true, size: 12 };
      sheet6.addRow([]);

      const typeHeaders = sheet6.addRow(['ประเภท', 'จำนวน', 'เปอร์เซ็นต์']);
      styleHeaderRow(typeHeaders);

      const totalMembers = data.memberGrowthStats.membersByType.reduce((s, i) => s + i.count, 0);
      data.memberGrowthStats.membersByType.forEach((item, i) => {
        const pct = totalMembers > 0
          ? `${((item.count / totalMembers) * 100).toFixed(1)}%`
          : '0%';
        const r = sheet6.addRow([
          MEMBER_TYPE_LABELS[item.memberType] || item.memberType,
          item.count,
          pct,
        ]);
        styleDataRow(r, i % 2 === 0);
      });
    }

    autoFitColumns(sheet6);

    // =============================================
    // Generate buffer and return
    // =============================================
    const buffer = await generateExcelBuffer(workbook);

    const dateStr = format(params.currentStart, 'yyyyMMdd');
    const endStr = format(params.currentEnd, 'yyyyMMdd');
    const filename = `summary-report-${dateStr}-${endStr}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[Excel API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate Excel',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
