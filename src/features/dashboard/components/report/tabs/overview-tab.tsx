// components/admin/report/tabs/overview-tab.tsx

import { Users, ShoppingCart, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ReportData } from '@/features/dashboard/summary-report.types';
import { StatCard } from '../stat-card';
import { chartTheme, chartTooltipStyle } from "@/config/chart-theme";

interface OverviewTabProps {
  reportData: ReportData;
}

export function OverviewTab({ reportData }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Section 1: All-time totals */}
      <div className="bg-background border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">สถิติรวมทั้งหมด</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Users} color="blue" label="สมาชิกทั้งหมด" value={reportData.totalMembers} unit="คน" />
          <StatCard icon={ShoppingCart} color="orange" label="คำสั่งจองทั้งหมด" value={reportData.totalOrders} unit="รายการ" />
          <StatCard icon={Eye} color="cyan" label="ยอดเข้าชมทั้งหมด" value={reportData.totalViews} unit="ครั้ง" />
        </div>
      </div>

      {/* Section 2: Period stats */}
      <div className="bg-background border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">สถิติช่วงเวลาที่เลือก</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <StatCard icon={ShoppingCart} color="pink" label="จองในช่วงที่เลือก" value={reportData.currentPeriodOrders} unit="รายการ" trend={reportData.orderTrend} />
          <StatCard icon={Eye} color="teal" label="ชมในช่วงที่เลือก" value={reportData.currentPeriodViews} unit="ครั้ง" trend={reportData.viewTrend} />
        </div>
      </div>

      {/* Monthly Chart */}
      {reportData.monthlyStats && reportData.monthlyStats.length > 0 && (
        <div className="bg-background border border-border rounded-xl p-4">
          <h3 className="text-base font-semibold text-foreground mb-4">ภาพรวมรายปี (12 เดือนย้อนหลัง)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData.monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="month" stroke={chartTheme.axis} fontSize={12} />
              <YAxis stroke={chartTheme.axis} fontSize={12} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                labelStyle={{ color: chartTheme.tooltipText }}
              />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke={chartTheme.series[0]} strokeWidth={2} name="คำสั่งจอง" />
              <Line type="monotone" dataKey="views" stroke={chartTheme.series[2]} strokeWidth={2} name="ยอดเข้าชม" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
