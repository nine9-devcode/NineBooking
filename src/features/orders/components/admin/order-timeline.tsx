"use client"

import { Clock, RefreshCw, Calendar } from "lucide-react"
import { formatDate } from "./order-types"

interface OrderTimelineProps {
  createdAt: string
  updatedAt: string
}

export function OrderTimeline({ createdAt, updatedAt }: OrderTimelineProps) {
  const hasBeenUpdated = updatedAt !== createdAt

  return (
    <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-card/80">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          ไทม์ไลน์
        </h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {/* สร้างใบจอง */}
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-primary/20 text-primary">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">สร้างใบจอง</p>
              <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
            </div>
          </div>

          {/* Connector line */}
          {hasBeenUpdated && (
            <div className="ml-[13px] h-4 border-l-2 border-border" />
          )}

          {/* อัพเดทล่าสุด */}
          {hasBeenUpdated && (
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-info/10 text-info">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">อัพเดทล่าสุด</p>
                <p className="text-xs text-muted-foreground">{formatDate(updatedAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}