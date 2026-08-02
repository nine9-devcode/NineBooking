// components/admin/report/tabs/members-tab.tsx

import { UserPlus, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ReportData } from '@/features/dashboard/summary-report.types';

const MEMBER_TYPE_LABELS: Record<string, string> = {
  customer: 'ลูกค้าทั่วไป',
  contractor: 'ผู้รับเหมา',
  dealer: 'ตัวแทนจำหน่าย',
  other: 'อื่นๆ',
};

interface MembersTabProps {
  reportData: ReportData;
}

export function MembersTab({ reportData }: MembersTabProps) {
  const { memberGrowthStats } = reportData;
  const trend = memberGrowthStats.memberGrowthTrend;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-5 h-5 text-success" />
            <p className="text-xs text-muted-foreground font-medium">สมาชิกใหม่ในช่วงที่เลือก</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{memberGrowthStats.newMembersInPeriod.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1">
            {trend > 0 ? <TrendingUp className="w-4 h-4 text-success" /> :
             trend < 0 ? <TrendingDown className="w-4 h-4 text-destructive" /> :
             <Minus className="w-4 h-4 text-muted-foreground" />}
            <span className={`text-xs font-semibold ${
              trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {trend > 0 ? '+' : ''}{trend}% จากช่วงก่อนหน้า
            </span>
          </div>
        </div>

        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-info" />
            <p className="text-xs text-muted-foreground font-medium">สมาชิกทั้งหมด</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{reportData.totalMembers.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">ผู้ใช้งาน (ไม่รวม Admin)</p>
        </div>

        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-chart-4" />
            <p className="text-xs text-muted-foreground font-medium">สมาชิกช่วงก่อนหน้า</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{memberGrowthStats.newMembersComparePeriod.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{reportData.dateRange.comparisonLabel}</p>
        </div>
      </div>

      {/* Member type breakdown */}
      {memberGrowthStats.membersByType.length > 0 && (
        <div className="bg-background border border-border rounded-xl p-4">
          <h3 className="text-base font-semibold text-foreground mb-4">แยกตามประเภทสมาชิก</h3>
          <div className="space-y-3">
            {memberGrowthStats.membersByType.map((item, index) => {
              const total = memberGrowthStats.membersByType.reduce((s, i) => s + i.count, 0);
              const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">
                    {MEMBER_TYPE_LABELS[item.memberType] || item.memberType}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-card rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-16 text-right">
                      {item.count.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground w-12 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
