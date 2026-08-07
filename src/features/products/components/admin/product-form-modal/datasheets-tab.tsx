"use client"

import { Link2 } from "lucide-react"
import { DatasheetInput } from "@/features/products/components/admin/shared/datasheet-input"
import type { DatasheetsTabProps } from "./types"

export function DatasheetsTab({ datasheets, onDatasheetsChange, loading }: DatasheetsTabProps) {
  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Link2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">เอกสารและ Datasheet</h3>
        <span className="text-muted-foreground text-xs font-normal">- ไม่บังคับ</span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">
        เพิ่ม link หรืออัปโหลดไฟล์เอกสารที่เกี่ยวข้องกับสินค้า เช่น User Manual, Datasheet,
        Specification Sheet
      </p>

      {/* Datasheet Input */}
      <div className="bg-card/50 rounded-xl p-4 border border-border">
        <DatasheetInput values={datasheets} onChange={onDatasheetsChange} disabled={loading} />
      </div>
    </div>
  )
}
