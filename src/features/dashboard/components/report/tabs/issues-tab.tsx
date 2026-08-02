// components/admin/report/tabs/issues-tab.tsx

import type { ReportData } from '@/features/dashboard/summary-report.types';

const ISSUE_CATEGORY_LABELS: Record<string, string> = {
  BOOKING: 'การจอง',
  PAYMENT: 'การชำระเงิน',
  USAGE_ISSUE: 'ปัญหาการใช้งาน',
  ACCOUNT: 'บัญชีผู้ใช้',
  OTHER: 'อื่นๆ',
};

interface IssuesTabProps {
  reportData: ReportData;
}

export function IssuesTab({ reportData }: IssuesTabProps) {
  const { contactIssueStats } = reportData;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-background border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-2 font-medium">ปัญหาทั้งหมด</p>
          <p className="text-2xl font-bold text-foreground">{contactIssueStats.totalIssues.toLocaleString()}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-2 font-medium">ในช่วงที่เลือก</p>
          <p className="text-2xl font-bold text-primary">{contactIssueStats.issuesInPeriod.toLocaleString()}</p>
        </div>
        <div className="bg-warning/10 border border-warning/50 rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-2 font-medium">รอดำเนินการ</p>
          <p className="text-2xl font-bold text-warning">{contactIssueStats.pendingIssues.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">PENDING</p>
        </div>
        <div className="bg-info/10 border border-info/50 rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-2 font-medium">กำลังดำเนินการ</p>
          <p className="text-2xl font-bold text-info">{contactIssueStats.inProgressIssues.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">IN PROGRESS</p>
        </div>
      </div>

      {/* Issues by Category */}
      {contactIssueStats.issuesByCategory.length > 0 && (
        <div className="bg-background border border-border rounded-xl p-4">
          <h3 className="text-base font-semibold text-foreground mb-4">แยกตามประเภทปัญหา (ในช่วงที่เลือก)</h3>
          <div className="space-y-3">
            {contactIssueStats.issuesByCategory.map((item, index) => {
              const total = contactIssueStats.issuesInPeriod;
              const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">
                    {ISSUE_CATEGORY_LABELS[item.category] || item.category}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-card rounded-full h-2">
                      <div
                        className="bg-warning rounded-full h-2 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-12 text-right">
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

      <div className="bg-background border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground">
          ปิดแล้วในช่วงที่เลือก:{' '}
          <span className="text-success font-semibold">
            {contactIssueStats.closedIssuesInPeriod.toLocaleString()}
          </span>{' '}
          เรื่อง
        </p>
      </div>
    </div>
  );
}
