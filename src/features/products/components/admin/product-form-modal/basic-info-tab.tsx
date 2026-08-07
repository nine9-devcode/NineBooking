"use client"

import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { BasicInfoTabProps } from "./types"

export function BasicInfoTab({
  register,
  control,
  errors,
  categories,
  loading,
}: BasicInfoTabProps) {
  return (
    <div className="space-y-6 p-1">
      {/* ชื่อสินค้า */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          ชื่อสินค้า
          <span className="text-destructive">*</span>
        </label>
        <Input
          {...register("name")}
          placeholder="เช่น กล้องวงจรปิด รุ่น X100"
          className="bg-card border-border text-foreground h-12 text-base"
          disabled={loading}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      {/* คำอธิบายย่อย */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          คำอธิบายย่อย (Subtitle)
          <span className="text-muted-foreground text-xs font-normal">- ไม่บังคับ</span>
        </label>
        <Input
          {...register("subtitle")}
          placeholder='เช่น 4.3" Facial Recognition Android Door Phone'
          className="bg-card border-border text-foreground h-12 text-base"
          disabled={loading}
          maxLength={300}
        />
        <p className="text-sm text-muted-foreground">
          ข้อความสั้นๆ ที่จะแสดงด้านล่างชื่อสินค้า (สูงสุด 300 ตัวอักษร)
        </p>
        {errors.subtitle && (
          <p className="text-sm text-destructive">{errors.subtitle.message}</p>
        )}
      </div>

      {/* Slug + หมวดหมู่ (2 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Slug */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            Slug
            <span className="text-destructive">*</span>
          </label>
          <Input
            {...register("slug")}
            placeholder="เช่น camera-x100"
            className="bg-card border-border text-foreground h-12 text-base"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">ใช้สำหรับ URL (a-z, 0-9, -)</p>
          {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
        </div>

        {/* หมวดหมู่ */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            หมวดหมู่
            <span className="text-destructive">*</span>
          </label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                <SelectTrigger className="bg-card border-border text-foreground h-12 text-base">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id}
                      className="text-foreground hover:bg-card"
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoryId && (
            <p className="text-sm text-destructive">{errors.categoryId.message}</p>
          )}
        </div>
      </div>

      {/* สถานะ */}
      <div className="flex items-center justify-between rounded-xl border border-border p-5 bg-card/50">
        <div className="space-y-1">
          <label className="text-base font-medium text-foreground">เปิดใช้งาน</label>
          <p className="text-sm text-muted-foreground">
            เมื่อเปิดใช้งาน สินค้าจะแสดงในหน้าเว็บไซต์
          </p>
        </div>
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={loading}
              className="scale-125"
            />
          )}
        />
      </div>
    </div>
  )
}
