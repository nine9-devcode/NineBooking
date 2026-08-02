// components/admin/quotations/quotations-stats.tsx

"use client"

import {
  FileText,
  FileEdit,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { QuotationStats } from "./types"

interface QuotationsStatsProps {
  stats: QuotationStats
  loading?: boolean
  activeFilter: string
  onFilterChange: (value: string) => void
}

export function QuotationsStats({ stats, loading, activeFilter, onFilterChange }: QuotationsStatsProps) {
  const statsConfig = [
    { key: "all", label: "ทั้งหมด", value: stats.total, icon: FileText, hover: "hover:border-border", active: "ring-ring border-border", iconBg: "bg-secondary/10", iconColor: "text-muted-foreground" },
    { key: "DRAFT", label: "ร่าง", value: stats.DRAFT, icon: FileEdit, hover: "hover:border-border", active: "ring-ring border-border", iconBg: "bg-secondary/10", iconColor: "text-muted-foreground" },
    { key: "SENT", label: "ยืนยัน", value: stats.SENT, icon: Send, hover: "hover:border-info/50", active: "ring-info border-info/40", iconBg: "bg-info/10", iconColor: "text-info" },
    { key: "ACCEPTED", label: "เสร็จสิ้น", value: stats.ACCEPTED, icon: CheckCircle2, hover: "hover:border-success/50", active: "ring-success border-success/40", iconBg: "bg-success/10", iconColor: "text-success" },
    { key: "REJECTED", label: "ปฏิเสธ", value: stats.REJECTED, icon: XCircle, hover: "hover:border-destructive/50", active: "ring-destructive border-destructive/40", iconBg: "bg-destructive/10", iconColor: "text-destructive" },
    { key: "EXPIRED", label: "หมดอายุ", value: stats.EXPIRED, icon: Clock, hover: "hover:border-warning/50", active: "ring-warning border-warning/40", iconBg: "bg-warning/10", iconColor: "text-warning" },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-background border border-border rounded-xl h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {statsConfig.map(({ key, label, value, icon: Icon, hover, active, iconBg, iconColor }) => {
        const isActive = activeFilter === key
        return (
          <Card
            key={key}
            onClick={() => onFilterChange(key)}
            className={`bg-background border-border cursor-pointer transition-all ${hover} ${isActive ? `ring-2 ${active}` : ""}`}
          >
            <CardHeader className="pb-2">
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <div className={`p-2 ${iconBg} rounded-lg`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}