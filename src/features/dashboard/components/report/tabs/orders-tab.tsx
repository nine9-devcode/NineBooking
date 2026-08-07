// components/admin/report/tabs/orders-tab.tsx

import type { ReportData } from "@/features/dashboard/summary-report.types"

interface OrdersTabProps {
  reportData: ReportData
}

export function OrdersTab({ reportData }: OrdersTabProps) {
  const statusItems = [
    {
      label: "รอดำเนินการ",
      value: reportData.pendingOrders,
      color: "bg-warning",
      textColor: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/50",
      status: "PENDING",
    },
    {
      label: "ยืนยันแล้ว",
      value: reportData.confirmedOrders,
      color: "bg-info",
      textColor: "text-info",
      bg: "bg-info/10",
      border: "border-info/50",
      status: "CONFIRMED",
    },
    {
      label: "เสร็จสิ้น",
      value: reportData.completedOrders,
      color: "bg-success",
      textColor: "text-success",
      bg: "bg-success/10",
      border: "border-success/50",
      status: "COMPLETED",
    },
    {
      label: "ยกเลิก",
      value: reportData.cancelledOrders,
      color: "bg-destructive",
      textColor: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/50",
      status: "CANCELLED",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusItems.map((item) => (
          <div key={item.status} className={`${item.bg} border ${item.border} rounded-xl p-4`}>
            <p className="text-xs text-muted-foreground mb-2 font-medium">{item.label}</p>
            <p className={`text-2xl font-bold ${item.textColor} mb-1`}>
              {item.value.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{item.status}</p>
          </div>
        ))}
      </div>

      {/* Status ratio */}
      <div className="bg-background border border-border rounded-xl p-4">
        <p className="text-sm text-foreground mb-3 font-medium">
          สรุปอัตราส่วนสถานะในช่วงที่เลือก
        </p>
        <div className="flex gap-4 flex-wrap text-sm">
          {statusItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 ${item.color} rounded-sm`} />
              <span className="text-muted-foreground">
                {item.label}:{" "}
                <span className="text-foreground font-semibold">
                  {reportData.currentPeriodOrders > 0
                    ? ((item.value / reportData.currentPeriodOrders) * 100).toFixed(1)
                    : "0"}
                  %
                </span>
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          * นับจากคำสั่งจองทั้งหมด {reportData.currentPeriodOrders.toLocaleString()} รายการ
          ในช่วงที่เลือก
        </p>
      </div>
    </div>
  )
}
