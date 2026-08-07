// components/complete-profile/personal-info-section.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2 } from "lucide-react"
import { RESIDENCE_TYPES } from "@/lib/constants"
import { CompleteProfileFormValues, FormErrors } from "./schema"

interface PersonalInfoSectionProps {
  formData: CompleteProfileFormValues
  formErrors: FormErrors
  isLoading: boolean
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleResidenceTypeChange: (value: string) => void
}

export function PersonalInfoSection({
  formData,
  formErrors,
  isLoading,
  handleChange,
  handleResidenceTypeChange,
}: PersonalInfoSectionProps) {
  // ตรวจสอบว่าค่าปัจจุบันเป็นค่าที่กำหนดไว้หรือไม่
  const isPresetValue = RESIDENCE_TYPES.some((t) => t.value === formData.residenceType)
  const isCustomValue =
    formData.residenceType && formData.residenceType !== "other" && !isPresetValue
  const showCustomInput = formData.residenceType === "other" || isCustomValue

  // เช็คว่าเบอร์ที่กรอกตรงกับเบอร์ที่ verify แล้วหรือไม่

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ชื่อ-นามสกุล */}
      <div className="space-y-2">
        <Label htmlFor="name">
          ชื่อ-นามสกุล <span className="text-destructive">*</span>
          <span className="text-xs text-muted-foreground ml-2">
            ({formData.name.length}/40)
          </span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="ชื่อ นามสกุล (ภาษาไทยหรืออังกฤษ)"
          value={formData.name}
          onChange={handleChange}
          disabled={isLoading}
          required
          maxLength={40}
          className={formErrors.name ? "border-destructive/40" : ""}
        />
        {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
        <p className="text-xs text-muted-foreground">
          กรอกชื่อ-นามสกุลจริง (ไม่อนุญาตตัวเลขหรืออักขระพิเศษ)
        </p>
      </div>

      {/* ชื่อเล่น */}
      <div className="space-y-2">
        <Label htmlFor="nickname">
          ชื่อเล่น <span className="text-destructive">*</span>
          <span className="text-xs text-muted-foreground ml-2">
            ({formData.nickname.length}/20)
          </span>
        </Label>
        <Input
          id="nickname"
          name="nickname"
          type="text"
          placeholder="ชื่อเล่น"
          value={formData.nickname}
          onChange={handleChange}
          disabled={isLoading}
          required
          maxLength={20}
          className={formErrors.nickname ? "border-destructive/40" : ""}
        />
        {formErrors.nickname && (
          <p className="text-sm text-destructive">{formErrors.nickname}</p>
        )}
      </div>

      {/* เบอร์โทรศัพท์ */}
      <div className="space-y-2">
        <Label htmlFor="phone">
          เบอร์โทรศัพท์ <span className="text-destructive">*</span>
          <span className="text-xs text-muted-foreground ml-2">
            ({formData.phone.length}/10)
          </span>
        </Label>
        <div className="relative">
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="081234****"
            value={formData.phone}
            onChange={handleChange}
            disabled={isLoading}
            required
            maxLength={10}
            className={formErrors.phone ? "border-destructive" : ""}
          />
        </div>
        {formErrors.phone && <p className="text-sm text-destructive">{formErrors.phone}</p>}
        <p className="text-xs text-muted-foreground">ใส่เบอร์โทรศัพท์ 10 หลัก</p>
      </div>

      {/* ประเภทที่อยู่อาศัย */}
      <div className="space-y-2">
        <Label htmlFor="residenceType">
          ประเภทที่อยู่อาศัย <span className="text-destructive">*</span>
        </Label>
        <Select
          value={
            isCustomValue || formData.residenceType === "other"
              ? "other"
              : formData.residenceType
          }
          onValueChange={(value) => {
            if (value === "other") {
              handleResidenceTypeChange("other")
            } else {
              handleResidenceTypeChange(value)
            }
          }}
          disabled={isLoading}
        >
          <SelectTrigger className={formErrors.residenceType ? "border-destructive/40" : ""}>
            <SelectValue
              placeholder={
                isCustomValue ? `อื่นๆ: ${formData.residenceType}` : "เลือกประเภทที่อยู่อาศัย"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {RESIDENCE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formErrors.residenceType && (
          <p className="text-sm text-destructive">{formErrors.residenceType}</p>
        )}
      </div>

      {/* ช่องกรอกประเภทที่อยู่อาศัยเอง (เมื่อเลือก "อื่นๆ") */}
      {showCustomInput && (
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customResidenceType">
            ระบุประเภทที่อยู่อาศัย <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customResidenceType"
            value={formData.residenceType === "other" ? "" : formData.residenceType}
            onChange={(e) => {
              const value = e.target.value
              if (value === "") {
                handleResidenceTypeChange("other")
              } else {
                handleResidenceTypeChange(value)
              }
            }}
            placeholder="เช่น หอพัก, บ้านเช่า, แฟลต"
            disabled={isLoading}
            maxLength={50}
            className={formData.residenceType === "other" ? "border-destructive/40" : ""}
          />
          {formData.residenceType === "other" && (
            <p className="text-sm text-destructive">กรุณาระบุประเภทที่อยู่อาศัย</p>
          )}
        </div>
      )}
    </div>
  )
}
