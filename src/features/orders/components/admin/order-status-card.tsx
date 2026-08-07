"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { isTerminal, nextStatuses, transitionMessage } from "@/features/orders/order-status"
import type { OrderStatus } from "@prisma/client"
import { getStatusConfig, STATUS_OPTIONS } from "./order-types"

interface OrderStatusCardProps {
  currentStatus: string
  newStatus: string
  onStatusChange: (value: string) => void
  cancelledBy?: string | null
}

export function OrderStatusCard({
  currentStatus,
  newStatus,
  onStatusChange,
  cancelledBy,
}: OrderStatusCardProps) {
  const statusConfig = getStatusConfig(currentStatus)
  const newStatusConfig = getStatusConfig(newStatus)
  const StatusIcon = statusConfig.icon
  const hasChanged = newStatus !== currentStatus

  // สถานะที่ไปต่อไม่ได้จะถูกปิด ไม่ใช่ซ่อน — ผู้ใช้จะได้เห็นว่ามีตัวเลือกนี้อยู่
  // แต่ตอนนี้เลือกไม่ได้ พร้อมเหตุผลใน title
  const from = currentStatus as OrderStatus
  const allowed = new Set<string>([currentStatus, ...nextStatuses(from)])
  const locked = isTerminal(from)

  return (
    <div className="bg-card/50 rounded-xl border border-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* สถานะปัจจุบัน */}
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${statusConfig.darkColor || statusConfig.color}`}>
            <StatusIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">สถานะปัจจุบัน</p>
            <p className="font-semibold text-foreground">{statusConfig.label}</p>
            {currentStatus === "CANCELLED" && cancelledBy && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {cancelledBy === "CUSTOMER" ? "ยกเลิกโดยลูกค้า" : "ยกเลิกโดยแอดมิน"}
              </p>
            )}
          </div>
        </div>

        {/* เปลี่ยนสถานะ */}
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground">เปลี่ยนสถานะ:</Label>
          <Select value={newStatus} onValueChange={onStatusChange} disabled={locked}>
            <SelectTrigger className="w-[180px] bg-secondary border-border text-foreground focus:ring-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {STATUS_OPTIONS.map((option) => {
                const optionConfig = getStatusConfig(option.value)
                const OptionIcon = optionConfig.icon
                return (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={!allowed.has(option.value)}
                    title={
                      allowed.has(option.value)
                        ? undefined
                        : transitionMessage(from, option.value as OrderStatus)
                    }
                    className="text-foreground focus:bg-secondary focus:text-foreground cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <OptionIcon className="w-4 h-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {locked && (
        <p className="mt-4 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
          {transitionMessage(from, from)}
        </p>
      )}

      {/* Warning เมื่อมีการเปลี่ยนแปลง */}
      {hasChanged && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
          <p className="text-sm text-warning">
            ⚠️ สถานะจะเปลี่ยนจาก &quot;{statusConfig.label}&quot; เป็น &quot;
            {newStatusConfig.label}&quot; เมื่อกดบันทึก
          </p>
        </div>
      )}
    </div>
  )
}
