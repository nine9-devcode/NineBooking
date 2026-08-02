// app/api/admin/dashboard/summary-report/route.ts
// GET /api/admin/dashboard/summary-report - รายงานสรุปภาพรวมระบบแบบครบถ้วน

import { NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/api/guards"
import { calculateSummaryReport, parseDateParams } from '@/features/dashboard/report-data';

export async function GET(request: Request) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const compareMode = searchParams.get('compareMode') || 'previous_day';

    const validCompareModes = ['previous_day', 'previous_week', 'previous_month'];
    if (!validCompareModes.includes(compareMode)) {
      return NextResponse.json({ error: 'Invalid compare mode' }, { status: 400 });
    }

    let params;
    try {
      params = parseDateParams(startDateParam, endDateParam, compareMode);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid parameters' },
        { status: 400 }
      );
    }

    const reportData = await calculateSummaryReport(params);

    return NextResponse.json({
      success: true,
      ...reportData,
    });
  } catch (error) {
    console.error('Error fetching summary report:', error);

    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          error: 'Failed to fetch summary report',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch summary report' },
      { status: 500 }
    );
  }
}
