// ไฟล์: app/api/admin/users/export-pdf/route.tsx
// GET /api/admin/users/export-pdf - Export members list as PDF

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from '@/lib/db';
import { renderToBuffer } from '@react-pdf/renderer';
import {
  Document,
  Page,
  Text,
  View,
  pdfStyles,
  formatThaiDate,
  formatShortDate,
  StyleSheet,
} from '@/lib/pdf';

// Residence type mapping
const RESIDENCE_TYPES: Record<string, string> = {
  single_house: 'บ้านเดี่ยว',
  condo: 'คอนโด',
  townhouse: 'ทาวน์เฮาส์',
  apartment: 'อพาร์ทเมนต์',
  office: 'สำนักงาน',
  other: 'อื่นๆ',
};

// Member type mapping
const MEMBER_TYPE_LABELS: Record<string, string> = {
  customer: 'ลูกค้าทั่วไป',
  contractor: 'ผู้รับเหมา',
  dealer: 'ตัวแทนจำหน่าย',
  other: 'อื่นๆ',
};

// Additional styles for members list PDF
const listStyles = StyleSheet.create({
  filterInfo: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 15,
  },
  summaryRow: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333333',
  },
});

// Members List PDF Component
const MembersListPDF = ({
  members,
  filterInfo,
}: {
  members: any[];
  filterInfo: string;
}) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.headerTitle}>NINEBOOKING</Text>
          <Text style={pdfStyles.headerSubtitle}>รายชื่อสมาชิก</Text>
        </View>

        {/* Filter Info */}
        <Text style={listStyles.filterInfo}>{filterInfo}</Text>

        {/* Table */}
        <View style={pdfStyles.table}>
          {/* Table Header */}
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, { width: 25 }]}>#</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 80 }]}>ชื่อ</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 50 }]}>ชื่อเล่น</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 70 }]}>เบอร์โทร</Text>
            <Text style={[pdfStyles.tableHeaderCell, { flex: 1 }]}>อีเมล</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 100 }]}>ประเภทสมาชิก/หมายเหตุ</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 70 }]}>ประเภทที่อยู่</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 40, textAlign: 'center' }]}>ใบจอง</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 65 }]}>วันที่สมัคร</Text>
          </View>

          {/* Table Rows */}
          {members.map((member, index) => {
            const residenceDisplay = member.residenceType
              ? RESIDENCE_TYPES[member.residenceType] || member.residenceType
              : '-';

            const memberTypeDisplay = member.memberType
              ? MEMBER_TYPE_LABELS[member.memberType] || member.memberType
              : 'ลูกค้าทั่วไป'; // default

            const memberTypeNote = member.memberTypeNote;
            const memberTypeText = memberTypeNote 
              ? `${memberTypeDisplay}\n(${memberTypeNote})` 
              : memberTypeDisplay;

            return (
              <View key={member.id} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: 25 }]}>{index + 1}</Text>
                <Text style={[pdfStyles.tableCell, { width: 80 }]}>{member.name || '-'}</Text>
                <Text style={[pdfStyles.tableCell, { width: 50 }]}>
                  {member.nickname || '-'}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: 70 }]}>
                  {member.phone || '-'}
                </Text>
                <Text style={[pdfStyles.tableCell, { flex: 1 }]}>
                  {member.email || '-'}
                </Text>
                
                {/* คอลัมน์ประเภทสมาชิก */}
                <Text style={[pdfStyles.tableCell, { width: 100, fontSize: 8 }]}>
                  {memberTypeText}
                </Text>

                <Text style={[pdfStyles.tableCell, { width: 70 }]}>
                  {residenceDisplay}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: 40, textAlign: 'center' }]}>
                  {member._count.orders}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: 65 }]}>
                  {formatShortDate(member.createdAt)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={listStyles.summaryRow}>
          <Text style={listStyles.summaryText}>รวมทั้งหมด: {members.length} คน</Text>
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

    const { searchParams } = new URL(request.url);

    // Get filter params
    const search = searchParams.get('search') || '';
    const residenceType = searchParams.get('residenceType') || '';
    const memberType = searchParams.get('memberType') || '';

    // Build where clause - only non-admin users
    const where: any = {
      role: 'user',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (residenceType) {
      where.residenceType = residenceType;
    }

    if (memberType && memberType !== 'all') {
      where.memberType = memberType;
    }

    // Fetch members with order count
    const members = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        nickname: true,
        phone: true,
        email: true,
        memberType: true,
        memberTypeNote: true,
        residenceType: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    // Build filter info text
    let filterInfo = `ส่งออกเมื่อ: ${formatThaiDate(new Date())}`;
  
    if (residenceType) {
      filterInfo += ` | ประเภทที่อยู่: ${RESIDENCE_TYPES[residenceType] || residenceType}`;
    }
    if (memberType && memberType !== 'all') {
      filterInfo += ` | ประเภทสมาชิก: ${MEMBER_TYPE_LABELS[memberType] || memberType}`;
    }
    if (search) {
      filterInfo += ` | ค้นหา: "${search}"`;
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <MembersListPDF members={members} filterInfo={filterInfo} />
    );

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `members-${dateStr}.pdf`;

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}