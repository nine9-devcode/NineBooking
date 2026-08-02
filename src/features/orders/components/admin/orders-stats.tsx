"use client"

import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react"

interface Stats {
  total: number
  PENDING: number
  CONFIRMED: number
  COMPLETED: number
  CANCELLED: number
}

interface OrdersStatsProps {
  stats: Stats
  loading?: boolean
}

export function OrdersStats({ stats, loading }: OrdersStatsProps) {
  const statsConfig = [
    {
      key: "total",
      label: "ทั้งหมด",
      value: stats.total,
      icon: ShoppingBag,
      bgColor: "bg-secondary",
      iconColor: "text-foreground",
      valueColor: "text-foreground",
    },
    {
      key: "PENDING",
      label: "รอดำเนินการ",
      value: stats.PENDING,
      icon: Clock,
      bgColor: "bg-warning/10",
      iconColor: "text-warning",
      valueColor: "text-warning",
    },
    {
      key: "CONFIRMED",
      label: "ยืนยันแล้ว",
      value: stats.CONFIRMED,
      icon: CheckCircle2,
      bgColor: "bg-info/10",
      iconColor: "text-info",
      valueColor: "text-info",
    },
    {
      key: "COMPLETED",
      label: "เสร็จสิ้น",
      value: stats.COMPLETED,
      icon: CheckCircle2,
      bgColor: "bg-success/10",
      iconColor: "text-success",
      valueColor: "text-success",
    },
    {
      key: "CANCELLED",
      label: "ยกเลิก",
      value: stats.CANCELLED,
      icon: XCircle,
      bgColor: "bg-destructive/10",
      iconColor: "text-destructive",
      valueColor: "text-destructive",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {statsConfig.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.key}
            className="bg-card/50 rounded-xl border border-border p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div>
                {loading ? (
                  <div className="h-8 w-12 bg-secondary rounded animate-pulse" />
                ) : (
                  <p className={`text-2xl font-bold ${stat.valueColor}`}>
                    {stat.value}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}