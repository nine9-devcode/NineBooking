// components/admin/users/edit-user-modal/personal-info-tab.tsx
"use client"

import { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { RESIDENCE_TYPES, MEMBER_TYPE_LABELS } from "@/lib/constants"
import { User, Mail, Phone, Home, Users, MessageSquare } from "lucide-react"
import { EditUserFormValues } from "./schema"

interface PersonalInfoTabProps {
  form: UseFormReturn<EditUserFormValues>
}

export function PersonalInfoTab({ form }: PersonalInfoTabProps) {
  const watchedResidenceType = form.watch("residenceType")

  // ตรวจสอบว่าค่าปัจจุบันเป็นค่าที่กำหนดไว้หรือไม่
  const isPresetValue = RESIDENCE_TYPES.some((t) => t.value === watchedResidenceType)
  // ถ้าไม่ใช่ค่า preset และไม่ใช่ "other" แสดงว่าเป็นค่า custom ที่เคยกรอกไว้
  const isCustomValue =
    watchedResidenceType && watchedResidenceType !== "other" && !isPresetValue
  // แสดง input กรอกเองเมื่อเลือก "other" หรือมีค่า custom
  const showCustomInput = watchedResidenceType === "other" || isCustomValue

  return (
    <div className="space-y-6 py-2">
      {/* Row 1: Email + Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* อีเมล (แก้ไม่ได้) */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                อีเมล
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled
                  className="bg-card/50 border-border text-muted-foreground truncate"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* ชื่อ-นามสกุล */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                ชื่อ-นามสกุล <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="ชื่อ นามสกุล"
                  className="bg-card border-border text-foreground focus:border-primary"
                />
              </FormControl>
              <FormMessage className="text-destructive" />
            </FormItem>
          )}
        />
      </div>

      {/* Row 2: Nickname + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ชื่อเล่น */}
        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">
                ชื่อเล่น <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  maxLength={20}
                  placeholder="ชื่อเล่น"
                  className="bg-card border-border text-foreground focus:border-primary"
                />
              </FormControl>
              <FormMessage className="text-destructive" />
            </FormItem>
          )}
        />

        {/* เบอร์โทร */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                เบอร์โทรศัพท์ <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  maxLength={10}
                  placeholder="08xxxxxxxx"
                  className="bg-card border-border text-foreground focus:border-primary"
                />
              </FormControl>
              <FormMessage className="text-destructive" />
            </FormItem>
          )}
        />
      </div>

      {/* Row 3: Member Type + Residence Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ประเภทสมาชิก */}
        <FormField
          control={form.control}
          name="memberType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                ประเภทสมาชิก <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger className="bg-card border-border text-foreground focus:border-primary min-w-0">
                    <SelectValue placeholder="เลือกประเภทสมาชิก" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border">
                  {Object.entries(MEMBER_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem
                      key={value}
                      value={value}
                      className="text-foreground hover:bg-secondary focus:bg-secondary"
                    >
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-destructive" />
            </FormItem>
          )}
        />

        {/* ประเภทที่อยู่อาศัย */}
        <FormField
          control={form.control}
          name="residenceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" />
                ประเภทที่อยู่อาศัย <span className="text-destructive">*</span>
              </FormLabel>
              <Select
                onValueChange={(value) => {
                  if (value === "other") {
                    // ถ้าเลือก "อื่นๆ" ให้ set เป็น "other" ก่อน แล้วค่อยให้กรอก
                    field.onChange("other")
                  } else {
                    field.onChange(value)
                  }
                }}
                value={
                  isCustomValue || watchedResidenceType === "other"
                    ? "other"
                    : field.value || ""
                }
              >
                <FormControl>
                  <SelectTrigger className="bg-card border-border text-foreground focus:border-primary min-w-0">
                    <SelectValue
                      placeholder={
                        isCustomValue
                          ? `อื่นๆ: ${watchedResidenceType}`
                          : "เลือกประเภทที่อยู่อาศัย"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border">
                  {RESIDENCE_TYPES.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="text-foreground hover:bg-secondary focus:bg-secondary"
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-destructive" />
            </FormItem>
          )}
        />
      </div>

      {/* ช่องกรอกประเภทที่อยู่อาศัยเอง */}
      {showCustomInput && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            ระบุประเภทที่อยู่อาศัย <span className="text-destructive">*</span>
          </label>
          <Input
            value={watchedResidenceType === "other" ? "" : watchedResidenceType || ""}
            onChange={(e) => {
              const value = e.target.value
              // ถ้าลบจนว่าง set เป็น "other"
              if (value === "") {
                form.setValue("residenceType", "other")
              } else {
                form.setValue("residenceType", value)
              }
            }}
            placeholder="เช่น หอพัก, บ้านเช่า, แฟลต"
            className="bg-card border-border text-foreground focus:border-primary"
          />
          {/* error ถ้ายังไม่ได้กรอก */}
          {watchedResidenceType === "other" && (
            <p className="text-sm text-destructive">กรุณาระบุประเภทที่อยู่อาศัย</p>
          )}
        </div>
      )}

      {/* หมายเหตุประเภทสมาชิก */}
      <FormField
        control={form.control}
        name="memberTypeNote"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              หมายเหตุประเภทสมาชิก
              <span className="text-muted-foreground text-xs font-normal ml-1">
                (ไม่บังคับ)
              </span>
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value || ""}
                rows={2}
                maxLength={200}
                placeholder="ระบุหมายเหตุเพิ่มเติม เช่น ประเภทกลุ่มลูกค้า, พื้นที่ติดตั้ง, โอกาสในการปิดขาย"
                className="bg-card border-border text-foreground focus:border-primary resize-none"
              />
            </FormControl>
            <FormDescription className="text-muted-foreground text-xs">
              หมายเหตุนี้จะแสดงในตารางสมาชิกใต้ประเภทสมาชิก
            </FormDescription>
            <FormMessage className="text-destructive" />
          </FormItem>
        )}
      />
    </div>
  )
}
