// components/admin/contact-issues/issue-info-card.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  BOOKING: { label: "การจอง", className: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  PAYMENT: { label: "การชำระเงิน", className: "bg-info/10 text-info border-info/20" },
  USAGE_ISSUE: { label: "ปัญหาการใช้งาน", className: "bg-destructive/10 text-destructive border-destructive/20" },
  ACCOUNT: { label: "บัญชีผู้ใช้", className: "bg-info/10 text-info border-info/20" },
  OTHER: { label: "อื่นๆ", className: "bg-secondary/10 text-muted-foreground border-border" },
}

interface IssueInfoCardProps {
  subject: string
  description: string
  category?: string
}

export function IssueInfoCard({ subject, description, category }: IssueInfoCardProps) {
  const categoryInfo = category ? CATEGORY_CONFIG[category] : null

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          ข้อมูลการแจ้งปัญหา
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Category */}
        {categoryInfo && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              ประเภท
            </label>
            <Badge variant="outline" className={categoryInfo.className}>
              {categoryInfo.label}
            </Badge>
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            หัวข้อ
          </label>
          <p className="text-foreground font-medium text-lg">{subject}</p>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            รายละเอียด
          </label>
          <div className="bg-background/50 rounded-lg p-4 text-foreground whitespace-pre-wrap border border-border max-h-64 overflow-y-auto">
            {description}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
