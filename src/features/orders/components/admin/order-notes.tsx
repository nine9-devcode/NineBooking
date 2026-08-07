"use client"

import { Textarea } from "@/components/ui/textarea"
import { FileText, MessageSquare } from "lucide-react"

interface OrderCustomerNoteProps {
  note: string | null
}

export function OrderCustomerNote({ note }: OrderCustomerNoteProps) {
  if (!note) return null

  return (
    <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-card/80">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          หมายเหตุจากลูกค้า
        </h2>
      </div>
      <div className="p-6">
        <p className="text-foreground bg-secondary/50 p-4 rounded-lg border border-border">
          {note}
        </p>
      </div>
    </div>
  )
}

interface OrderAdminNoteProps {
  note: string
  onChange: (value: string) => void
}

export function OrderAdminNote({ note, onChange }: OrderAdminNoteProps) {
  return (
    <div className="bg-card/50 rounded-xl border border-border p-6">
      <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        หมายเหตุจากแอดมิน
      </h2>
      <Textarea
        value={note}
        onChange={(e) => onChange(e.target.value)}
        placeholder="เพิ่มหมายเหตุถึงลูกค้า..."
        rows={4}
        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
      />
      <p className="text-xs text-muted-foreground mt-2">
        💡 หมายเหตุนี้จะแสดงให้ลูกค้าเห็นในหน้ารายละเอียดคำสั่งจอง
      </p>
    </div>
  )
}
