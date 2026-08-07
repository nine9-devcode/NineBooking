// components/admin/contact-issues/issue-info-card.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"
import type { IssueCategory } from "@prisma/client"
import { ISSUE_CATEGORY } from "@/components/ui/status-badge"

interface IssueInfoCardProps {
  subject: string
  description: string
  category?: string
}

export function IssueInfoCard({ subject, description, category }: IssueInfoCardProps) {
  const categoryInfo = category ? ISSUE_CATEGORY[category as IssueCategory] : null

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
