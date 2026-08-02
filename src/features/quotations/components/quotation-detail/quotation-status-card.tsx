// components/admin/quotations/quotation-detail/quotation-status-card.tsx

"use client"

import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  FileEdit,
  RotateCcw,
  Check,
} from "lucide-react"
import { QuotationStatus } from "../types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QuotationStatusCardProps {
  currentStatus: QuotationStatus
  newStatus: QuotationStatus
  onStatusChange: (status: QuotationStatus) => void
  readOnly?: boolean
}

// Status labels ภาษาไทย
const STATUS_LABELS: Record<QuotationStatus, string> = {
  DRAFT: "ร่าง",
  SENT: "ยืนยัน",
  ACCEPTED: "เสร็จสิ้น",
  REJECTED: "ปฏิเสธ",
  EXPIRED: "หมดอายุ",
}

// Status colors
const STATUS_COLORS: Record<QuotationStatus, string> = {
  DRAFT: "bg-secondary/10 text-muted-foreground border-border",
  SENT: "bg-info/10 text-info border-info/30",
  ACCEPTED: "bg-success/10 text-success border-success/30",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/30",
  EXPIRED: "bg-warning/10 text-warning border-warning/30",
}

export function QuotationStatusCard({
  currentStatus,
  newStatus,
  onStatusChange,
  readOnly = false,
}: QuotationStatusCardProps) {
  
  // Check step status
  const isStepCompleted = (step: 'DRAFT' | 'SENT' | 'FINAL') => {
    if (step === 'DRAFT') return true // Always completed
    if (step === 'SENT') return ['SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'].includes(newStatus)
    if (step === 'FINAL') return ['ACCEPTED', 'REJECTED', 'EXPIRED'].includes(newStatus)
    return false
  }

  const isStepActive = (step: 'DRAFT' | 'SENT' | 'FINAL') => {
    if (step === 'DRAFT') return newStatus === 'DRAFT'
    if (step === 'SENT') return newStatus === 'SENT'
    if (step === 'FINAL') return ['ACCEPTED', 'REJECTED', 'EXPIRED'].includes(newStatus)
    return false
  }

  // Get final step icon & color
  const getFinalStepStyle = () => {
    switch (newStatus) {
      case 'ACCEPTED':
        return { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/40' }
      case 'REJECTED':
        return { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/40' }
      case 'EXPIRED':
        return { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/40' }
      default:
        return { icon: null, color: 'text-muted-foreground', bg: 'bg-secondary', border: 'border-border' }
    }
  }

  const finalStyle = getFinalStepStyle()
  const FinalIcon = finalStyle.icon
  const hasChanges = newStatus !== currentStatus

  return (
    <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card/80 flex justify-between items-center">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <FileEdit className="w-5 h-5 text-primary" />
          สถานะใบเสนอราคา
        </h2>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded">
              มีการเปลี่ยนแปลง
            </span>
          )}
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border",
            STATUS_COLORS[newStatus]
          )}>
            {STATUS_LABELS[newStatus]}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* === STEPPER === */}
        <div className="relative">
          {/* Progress Line Background */}
          <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-secondary z-0"/>
          
          {/* Progress Line Active */}
          <div 
            className={cn(
              "absolute top-5 left-[10%] h-0.5 bg-gradient-to-r from-primary to-primary transition-all duration-500 z-0",
              newStatus === 'DRAFT' && "w-0",
              newStatus === 'SENT' && "w-[40%]",
              ['ACCEPTED', 'REJECTED', 'EXPIRED'].includes(newStatus) && "w-[80%]",
            )}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            
            {/* Step 1: Draft */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                "border-primary bg-background text-primary"
              )}>
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-primary">ร่าง</p>
                <p className="text-[10px] text-muted-foreground">สร้างแล้ว</p>
              </div>
            </div>

            {/* Step 2: Sent */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                isStepCompleted('SENT') 
                  ? "border-primary bg-background" 
                  : "border-border bg-background"
              )}>
                {isStepCompleted('SENT') && !isStepActive('SENT') ? (
                  <Check className="w-5 h-5 text-primary" />
                ) : (
                  <Send className={cn(
                    "w-5 h-5",
                    isStepActive('SENT') ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
              </div>
              <div className="text-center">
                <p className={cn(
                  "text-xs font-medium",
                  isStepCompleted('SENT') ? "text-primary" : "text-muted-foreground"
                )}>
                  ยืนยัน
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isStepActive('SENT') ? "รอผลลัพธ์" : isStepCompleted('SENT') ? "เสร็จสิ้น" : "รอดำเนินการ"}
                </p>
              </div>
            </div>

            {/* Step 3: Final */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                isStepCompleted('FINAL') 
                  ? `${finalStyle.border} ${finalStyle.bg}` 
                  : "border-border bg-card"
              )}>
                {FinalIcon ? (
                  <FinalIcon className={cn("w-5 h-5", finalStyle.color)} />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                )}
              </div>
              <div className="text-center">
                <p className={cn(
                  "text-xs font-medium",
                  isStepCompleted('FINAL') ? finalStyle.color : "text-muted-foreground"
                )}>
                  ผลลัพธ์
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isStepCompleted('FINAL') ? STATUS_LABELS[newStatus] : "รอการตัดสินใจ"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* === ACTION BUTTONS === */}
        {!readOnly && <div className="pt-4 border-t border-border">
          
          {/* DRAFT: Show send button */}
          {newStatus === 'DRAFT' && (
            <div className="space-y-3">
              <Button 
                onClick={() => onStatusChange('SENT')}
                className="w-full bg-info hover:bg-info text-primary-foreground h-11"
              >
                <Send className="w-4 h-4 mr-2" />
                ยืนยันใบเสนอราคา
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                หลังจากยืนยันแล้ว จะสามารถบันทึกผลลัพธ์ได้
              </p>
            </div>
          )}

          {/* SENT: Show decision buttons */}
          {newStatus === 'SENT' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">บันทึกผลลัพธ์จากลูกค้า:</p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => onStatusChange('ACCEPTED')}
                  className="bg-success hover:bg-success text-success-foreground h-11"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  เสร็จสิ้น
                </Button>
                <Button 
                  onClick={() => onStatusChange('REJECTED')}
                  className="bg-destructive hover:bg-destructive text-destructive-foreground h-11"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  ปฏิเสธ
                </Button>
              </div>

              {/* Expired as secondary option */}
              <button
                onClick={() => onStatusChange('EXPIRED')}
                className="w-full text-center text-xs text-warning hover:text-warning py-2 transition-colors"
              >
                <Clock className="w-3 h-3 inline mr-1" />
                หรือ ทำเครื่องหมายว่าหมดอายุ
              </button>
            </div>
          )}

          {/* FINAL STATES: Show result & revert option */}
          {['ACCEPTED', 'REJECTED', 'EXPIRED'].includes(newStatus) && (
            <div className="space-y-4">
              {/* Result Banner */}
              <div className={cn(
                "p-4 rounded-lg border flex items-center gap-3",
                newStatus === 'ACCEPTED' && "bg-success/10 border-success/40",
                newStatus === 'REJECTED' && "bg-destructive/10 border-destructive/40",
                newStatus === 'EXPIRED' && "bg-warning/10 border-warning/40",
              )}>
                {newStatus === 'ACCEPTED' && <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />}
                {newStatus === 'REJECTED' && <XCircle className="w-6 h-6 text-destructive flex-shrink-0" />}
                {newStatus === 'EXPIRED' && <Clock className="w-6 h-6 text-warning flex-shrink-0" />}
                
                <div>
                  <p className={cn(
                    "font-medium",
                    newStatus === 'ACCEPTED' && "text-success",
                    newStatus === 'REJECTED' && "text-destructive",
                    newStatus === 'EXPIRED' && "text-warning",
                  )}>
                    {newStatus === 'ACCEPTED' && "ใบเสนอราคาเสร็จสิ้นแล้ว"}
                    {newStatus === 'REJECTED' && "ลูกค้าปฏิเสธใบเสนอราคา"}
                    {newStatus === 'EXPIRED' && "ใบเสนอราคาหมดอายุแล้ว"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    การดำเนินการสิ้นสุดแล้ว
                  </p>
                </div>
              </div>

              {/* Revert Option */}
              <button
                onClick={() => onStatusChange('SENT')}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                ย้อนกลับเป็น &quot;ยืนยัน&quot;
              </button>
            </div>
          )}
        </div>}
      </div>
    </div>
  )
}