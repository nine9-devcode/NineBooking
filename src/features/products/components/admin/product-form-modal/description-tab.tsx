"use client"

import { Controller } from "react-hook-form"
import { FileText } from "lucide-react"
// Note: เมื่อย้ายไปใช้งานจริง ให้เปลี่ยน path ตามโครงสร้างโปรเจกต์
import { RichTextEditor } from "@/features/products/components/admin/shared/rich-text-editor"
import type { DescriptionTabProps } from "./types"

export function DescriptionTab({ control, errors, loading }: DescriptionTabProps) {
  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">รายละเอียดสินค้า</h3>
        <span className="text-destructive">*</span>
      </div>

      {/* Rich Text Editor */}
      <div className="space-y-2">
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="รายละเอียดเต็มของสินค้า เช่น คุณสมบัติ, สเปค, ขนาด, วัสดุ ฯลฯ..."
              disabled={loading}
              className="min-h-[400px]"
            />
          )}
        />

        <p className="text-sm text-muted-foreground">
          ใช้ toolbar ด้านบนเพื่อจัดรูปแบบข้อความ เช่น ตัวหนา, หัวข้อ, รายการ, จัดข้อความ
        </p>

        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>
    </div>
  )
}
