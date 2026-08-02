// components/admin/contact-issues/contact-issues-stats.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MessageSquare, AlertCircle, Clock, CheckCircle2 } from "lucide-react"

interface ContactIssuesStatsProps {
  stats: {
    total: number
    pending: number
    inProgress: number
    closed: number
  }
  loading?: boolean
  activeStatus: string
  onStatusChange: (value: string) => void
}

export default function ContactIssuesStats({ stats, loading, activeStatus, onStatusChange }: ContactIssuesStatsProps) {
  const cards = [
    { title: "รายการทั้งหมด", value: stats.total, icon: MessageSquare, status: "", hover: "hover:border-info/50", active: "ring-info border-info/40", iconBg: "bg-info/10", iconColor: "text-info" },
    { title: "รอดำเนินการ", value: stats.pending, icon: AlertCircle, status: "PENDING", hover: "hover:border-primary/50", active: "ring-primary border-primary/40", iconBg: "bg-primary/10", iconColor: "text-primary" },
    { title: "กำลังดำเนินการ", value: stats.inProgress, icon: Clock, status: "IN_PROGRESS", hover: "hover:border-info/50", active: "ring-info border-info/40", iconBg: "bg-info/10", iconColor: "text-info" },
    { title: "เสร็จสิ้น", value: stats.closed, icon: CheckCircle2, status: "CLOSED", hover: "hover:border-success/50", active: "ring-success border-success/40", iconBg: "bg-success/10", iconColor: "text-success" },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-background border border-border rounded-xl h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ title, value, icon: Icon, status, hover, active, iconBg, iconColor }) => {
        const isActive = activeStatus === status
        return (
          <Card
            key={status}
            onClick={() => onStatusChange(status)}
            className={`bg-background border-border cursor-pointer transition-all ${hover} ${isActive ? `ring-2 ${active}` : ""}`}
          >
            <CardHeader className="pb-2">
              <p className="text-sm text-muted-foreground">{title}</p>
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