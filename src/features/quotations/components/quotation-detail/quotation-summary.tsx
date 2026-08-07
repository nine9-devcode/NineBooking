// components/admin/quotations/quotation-detail/quotation-summary.tsx

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calculator } from "lucide-react"
import { QuotationTotals } from "./quotation-types"
import { formatCurrency } from "../constants"

interface QuotationSummaryProps {
  totals: QuotationTotals
  includeVat: boolean
  onIncludeVatChange: (value: boolean) => void
  vatPercent: number
  onVatPercentChange: (value: number) => void
  readOnly?: boolean
}

export function QuotationSummary({
  totals,
  includeVat,
  onIncludeVatChange,
  vatPercent,
  onVatPercentChange,
  readOnly = false,
}: QuotationSummaryProps) {
  return (
    <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-card/80">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          สรุปยอดเงิน
        </h2>
      </div>
      <div className="p-6 space-y-4">
        {/* VAT Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              id="include-vat"
              checked={includeVat}
              onCheckedChange={onIncludeVatChange}
              disabled={readOnly}
            />
            <Label htmlFor="include-vat" className="text-foreground cursor-pointer">
              รวมภาษีมูลค่าเพิ่ม (VAT)
            </Label>
          </div>

          {includeVat && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={vatPercent}
                onChange={(e) => onVatPercentChange(parseFloat(e.target.value) || 0)}
                disabled={readOnly}
                className="w-20 bg-secondary border-border text-foreground text-right h-9"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          )}
        </div>

        {/* Amounts */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex justify-between text-foreground">
            <span>รวมเป็นเงิน</span>
            <span className="font-medium">{formatCurrency(totals.subtotal)} บาท</span>
          </div>

          {includeVat && (
            <div className="flex justify-between text-foreground">
              <span>ภาษีมูลค่าเพิ่ม {vatPercent}%</span>
              <span className="font-medium">{formatCurrency(totals.vatAmount)} บาท</span>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t border-border">
            <span className="text-foreground font-semibold text-lg">จำนวนเงินรวมทั้งสิ้น</span>
            <span className="text-primary font-bold text-xl">
              {formatCurrency(totals.totalAmount)} บาท
            </span>
          </div>
        </div>

        {/* Note */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 ยอดเงินจะคำนวณใหม่อัตโนมัติเมื่อแก้ไขราคาสินค้า
          </p>
        </div>
      </div>
    </div>
  )
}
