// components/admin/quotations/quotation-detail/quotation-timeline.tsx

"use client"

import { Clock, User, Calendar, AlertCircle } from "lucide-react"
import { formatDate } from "../constants"

interface QuotationTimelineProps {
  createdAt: string
  updatedAt: string
  validUntil: string
  createdByName: string | null
}

export function QuotationTimeline({
  createdAt,
  updatedAt,
  validUntil,
  createdByName,
}: QuotationTimelineProps) {
  const isExpired = new Date(validUntil) < new Date()

  return (
    <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-card/80">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          ข้อมูลเวลา
        </h2>
      </div>
      <div className="p-6 space-y-4">
        {/* สร้างเมื่อ */}
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">สร้างเมื่อ</p>
            <p className="text-foreground">{formatDate(createdAt, true)}</p>
          </div>
        </div>

        {/* มีผลถึง */}
        <div className="flex items-center gap-3">
          {isExpired ? (
            <AlertCircle className="w-5 h-5 text-destructive" />
          ) : (
            <Calendar className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-xs text-muted-foreground">มีผลถึง</p>
            <p className={isExpired ? "text-destructive" : "text-foreground"}>
              {formatDate(validUntil)}
              {isExpired && (
                <span className="text-xs text-destructive ml-2">(หมดอายุแล้ว)</span>
              )}
            </p>
          </div>
        </div>

        {/* อัปเดตล่าสุด */}
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">อัปเดตล่าสุด</p>
            <p className="text-foreground">{formatDate(updatedAt, true)}</p>
          </div>
        </div>

        {/* สร้างโดย */}
        {createdByName && (
          <div className="flex items-center gap-3 pt-3 border-t border-border">
            <User className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">สร้างโดย</p>
              <p className="text-foreground">{createdByName}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
