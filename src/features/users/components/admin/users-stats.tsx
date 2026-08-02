// components/admin/users/users-stats.tsx
"use client"

import { Users, UserCheck, Shield, UserX, Store, Briefcase, User, HelpCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface UsersStatsProps {
  stats: {
    total: number
    users: number
    admins: number
    newToday: number
    completedProfiles?: number
    incompleteProfiles?: number
    byType?: {
      dealer: number
      contractor: number
      customer: number
      other: number
    }
  }
  loading?: boolean
  activeMemberType: string
  activeRole: string
  onMemberTypeChange: (value: string) => void
  onRoleChange: (value: string) => void
}

export function UsersStats({ stats, loading, activeMemberType, activeRole, onMemberTypeChange, onRoleChange }: UsersStatsProps) {
  const mainCards = [
    {
      title: "สมาชิกทั้งหมด",
      value: stats?.total || 0,
      icon: Users,
      hover: "hover:border-info/50",
      active: "ring-info border-info/40",
      iconBg: "bg-info/10",
      iconColor: "text-info",
      onClick: () => { onMemberTypeChange("all"); onRoleChange("") },
      isActive: activeMemberType === "all" && activeRole === "",
    },
    {
      title: "ข้อมูลครบถ้วน",
      value: stats?.completedProfiles || 0,
      icon: UserCheck,
      hover: "hover:border-success/50",
      active: "ring-success border-success/40",
      iconBg: "bg-success/10",
      iconColor: "text-success",
      onClick: null as null | (() => void),
      isActive: false,
    },
    {
      title: "ข้อมูลไม่สมบูรณ์",
      value: stats?.incompleteProfiles || 0,
      icon: UserX,
      hover: "hover:border-warning/50",
      active: "ring-warning border-warning/40",
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      onClick: null as null | (() => void),
      isActive: false,
    },
    {
      title: "ผู้ดูแลระบบ",
      value: stats?.admins || 0,
      icon: Shield,
      hover: "hover:border-destructive/50",
      active: "ring-destructive border-destructive/40",
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      onClick: () => { onRoleChange("admin"); onMemberTypeChange("all") },
      isActive: activeRole === "admin",
    },
  ]

  const typeCards = [
    { title: "ตัวเเทนจำหน่าย", value: stats?.byType?.dealer || 0, icon: Store, type: "dealer", hover: "hover:border-chart-4/50", active: "ring-chart-4 border-chart-4/40", iconBg: "bg-chart-4/10", iconColor: "text-chart-4" },
    { title: "ผู้รับเหมา", value: stats?.byType?.contractor || 0, icon: Briefcase, type: "contractor", hover: "hover:border-info/50", active: "ring-info border-info/40", iconBg: "bg-info/10", iconColor: "text-info" },
    { title: "ลูกค้าทั่วไป", value: stats?.byType?.customer || 0, icon: User, type: "customer", hover: "hover:border-success/50", active: "ring-success border-success/40", iconBg: "bg-success/10", iconColor: "text-success" },
    { title: "อื่นๆ", value: stats?.byType?.other || 0, icon: HelpCircle, type: "other", hover: "hover:border-border", active: "ring-ring border-border", iconBg: "bg-secondary/10", iconColor: "text-muted-foreground" },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-background border border-border rounded-xl h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-background border border-border rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* แถว 1: การ์ดหลัก */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mainCards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.title}
              onClick={card.onClick ?? undefined}
              className={`bg-background border-border transition-all ${card.hover} ${card.onClick ? "cursor-pointer" : ""} ${card.isActive ? `ring-2 ${card.active}` : ""}`}
            >
              <CardHeader className="pb-2">
                <p className="text-sm text-muted-foreground">{card.title}</p>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <p className="text-2xl font-bold text-foreground">{card.value.toLocaleString()}</p>
                <div className={`p-2 ${card.iconBg} rounded-lg`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* แถว 2: ประเภทสมาชิก */}
      {stats?.byType && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {typeCards.map((card) => {
            const Icon = card.icon
            const isActive = activeMemberType === card.type
            return (
              <Card
                key={card.type}
                onClick={() => { onMemberTypeChange(card.type); onRoleChange("") }}
                className={`bg-background border-border cursor-pointer transition-all ${card.hover} ${isActive ? `ring-2 ${card.active}` : ""}`}
              >
                <CardHeader className="pb-2">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                </CardHeader>
                <CardContent className="flex items-center justify-between pt-0">
                  <p className="text-2xl font-bold text-foreground">{card.value.toLocaleString()}</p>
                  <div className={`p-2 ${card.iconBg} rounded-lg`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}