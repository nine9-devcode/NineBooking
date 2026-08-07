// components/admin/contact-issues/issue-status-card.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react"
import { ISSUE_STATUS } from "@/components/ui/status-badge"

type IssueStatus = "PENDING" | "IN_PROGRESS" | "CLOSED"

interface IssueStatusCardProps {
  status: IssueStatus
  onStatusChange: (status: IssueStatus) => void
}

export function IssueStatusCard({ status, onStatusChange }: IssueStatusCardProps) {
  const config = ISSUE_STATUS[status] ?? ISSUE_STATUS.PENDING
  const StatusIcon = config.icon

  return (
    <Card className={`${config.className} border`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Current Status Display */}
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-3 rounded-lg   border`}>
              <StatusIcon className={`w-6 h-6 `} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">สถานะปัจจุบัน</p>
              <p className={`text-lg font-semibold `}>
                {config.label}
              </p>
            </div>
          </div>

          {/* Status Selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">เปลี่ยนเป็น:</span>
            <Select value={status} onValueChange={(value) => onStatusChange(value as IssueStatus)}>
              <SelectTrigger className="w-full sm:w-52 bg-card border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="PENDING" className="text-foreground hover:bg-card focus:bg-card">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-warning" />
                    รอดำเนินการ
                  </div>
                </SelectItem>
                <SelectItem value="IN_PROGRESS" className="text-foreground hover:bg-card focus:bg-card">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-info" />
                    กำลังดำเนินการ
                  </div>
                </SelectItem>
                <SelectItem value="CLOSED" className="text-foreground hover:bg-card focus:bg-card">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    เสร็จสิ้น
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}