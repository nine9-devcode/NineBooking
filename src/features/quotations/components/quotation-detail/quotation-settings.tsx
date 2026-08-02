// components/admin/quotations/quotation-detail/quotation-settings.tsx

"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Settings, Calendar, FileText, StickyNote } from "lucide-react"
import { VALID_DAYS_OPTIONS, DEFAULT_PDF_NOTES } from "../constants"
import { cn } from "@/lib/utils"

type PdfNotesMode = 'template' | 'custom' | 'none'

function getPdfNotesMode(pdfNotes: string | null): PdfNotesMode {
  if (pdfNotes === null) return 'template'
  if (pdfNotes === '') return 'none'
  return 'custom'
}

interface QuotationSettingsProps {
  validDays: number
  onValidDaysChange: (value: number) => void
  notes: string
  onNotesChange: (value: string) => void
  pdfNotes: string | null
  onPdfNotesChange: (value: string | null) => void
  readOnly?: boolean
}

export function QuotationSettings({
  validDays,
  onValidDaysChange,
  notes,
  onNotesChange,
  pdfNotes,
  onPdfNotesChange,
  readOnly = false,
}: QuotationSettingsProps) {
  // Mode is tracked independently — NOT derived from pdfNotes value
  // This prevents auto-switching when user clears the textarea
  const [mode, setMode] = useState<PdfNotesMode>(() => getPdfNotesMode(pdfNotes))
  const [customText, setCustomText] = useState<string>(
    () => pdfNotes !== null && pdfNotes !== '' ? pdfNotes : DEFAULT_PDF_NOTES
  )

  const handleModeChange = (newMode: PdfNotesMode) => {
    setMode(newMode)
    if (newMode === 'template') {
      onPdfNotesChange(null)
    } else if (newMode === 'none') {
      onPdfNotesChange('')
    } else {
      // 'custom' — use current customText (preserves text even if empty)
      onPdfNotesChange(customText)
    }
  }

  const handleCustomTextChange = (text: string) => {
    setCustomText(text)
    onPdfNotesChange(text) // update parent value, but mode stays 'custom'
  }

  return (
    <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-card/80">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          ตั้งค่าเพิ่มเติม
        </h2>
      </div>
      <div className="p-6 space-y-6">
        {/* Valid Days */}
        <div>
          <Label className="flex items-center gap-2 text-foreground mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            ใบเสนอราคามีอายุ
          </Label>
          <Select
            value={validDays.toString()}
            onValueChange={(value) => onValidDaysChange(parseInt(value))}
            disabled={readOnly}
          >
            <SelectTrigger className="w-full sm:w-48 bg-secondary border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {VALID_DAYS_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value.toString()}
                  className="text-foreground hover:bg-secondary"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Admin Notes */}
        <div>
          <Label className="flex items-center gap-2 text-foreground mb-1">
            <StickyNote className="w-4 h-4 text-primary" />
            โน้ตสำหรับแอดมิน
          </Label>
          <p className="text-xs text-muted-foreground mb-3">ไม่แสดงใน PDF</p>
          <Textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="บันทึกภายใน (ถ้ามี) — ไม่แสดงในใบเสนอราคา PDF"
            disabled={readOnly}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none h-20"
          />
        </div>

        {/* PDF Notes */}
        <div>
          <Label className="flex items-center gap-2 text-foreground mb-3">
            <FileText className="w-4 h-4 text-primary" />
            หมายเหตุใน PDF
          </Label>

          {/* Mode selector */}
          {!readOnly && (
            <div className="flex gap-1 mb-3 p-1 bg-secondary/50 rounded-lg w-fit">
              {(['template', 'custom', 'none'] as PdfNotesMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleModeChange(m)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    mode === m
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {m === 'template' ? 'มาตรฐาน' : m === 'custom' ? 'กำหนดเอง' : 'ไม่มี'}
                </button>
              ))}
            </div>
          )}

          {/* Content area */}
          {mode === 'template' && (
            <div className="bg-secondary/30 border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2">ข้อความที่จะแสดงใน PDF:</p>
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {DEFAULT_PDF_NOTES}
              </p>
            </div>
          )}

          {mode === 'custom' && (
            <Textarea
              value={customText}
              onChange={(e) => handleCustomTextChange(e.target.value)}
              placeholder="ข้อความหมายเหตุที่จะแสดงใน PDF..."
              disabled={readOnly}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none h-32"
            />
          )}

          {mode === 'none' && (
            <div className="bg-secondary/30 border border-dashed border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground text-center">ไม่มีหมายเหตุแสดงใน PDF</p>
            </div>
          )}

          {readOnly && mode === 'template' && (
            <p className="text-xs text-muted-foreground mt-2">ใช้ฟอร์มมาตรฐาน</p>
          )}
          {readOnly && mode === 'none' && (
            <p className="text-xs text-muted-foreground mt-2">ไม่มีหมายเหตุ</p>
          )}
          {!readOnly && (
            <p className="text-xs text-muted-foreground mt-2">
              ข้อความนี้จะแสดงในส่วนหมายเหตุของใบเสนอราคา PDF
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
