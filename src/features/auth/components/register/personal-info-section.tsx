// components/register/personal-info-section.tsx
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, EyeOff } from "lucide-react"
import { RESIDENCE_TYPES } from "@/lib/constants"
import { RegisterFormValues, RegisterFormErrors } from "./schema"

interface PersonalInfoSectionProps {
  formData: RegisterFormValues
  formErrors: RegisterFormErrors
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // ตรวจสอบว่าเลือก "อื่นๆ" หรือไม่
  const showOtherInput = formData.residenceType === "other"

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
        {formErrors.name && (
          <p className="text-sm text-destructive">{formErrors.name}</p>
        )}
        <p className="text-xs text-muted-foreground">
          ใส่ชื่อ-นามสกุลภาษาไทยหรืออังกฤษ (3-40 ตัวอักษร)
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

      {/* อีเมล */}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="email">
          อีเมล <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="example@email.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          required
          autoComplete="email"
          className={formErrors.email ? "border-destructive/40" : ""}
        />
        {formErrors.email && (
          <p className="text-sm text-destructive">{formErrors.email}</p>
        )}
      </div>

      {/* รหัสผ่าน */}
      <div className="space-y-2">
        <Label htmlFor="password">
          รหัสผ่าน <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            required
            autoComplete="new-password"
            className={`pr-10 ${formErrors.password ? "border-destructive/40" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {formErrors.password && (
          <p className="text-sm text-destructive">{formErrors.password}</p>
        )}
        <p className="text-xs text-muted-foreground">
          ใส่รหัสผ่านอย่างน้อย 6 ตัวอักษร
        </p>
      </div>

      {/* ยืนยันรหัสผ่าน */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          ยืนยันรหัสผ่าน <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="ยืนยันรหัสผ่าน"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            required
            autoComplete="new-password"
            className={`pr-10 ${formErrors.confirmPassword ? "border-destructive/40" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {formErrors.confirmPassword && (
          <p className="text-sm text-destructive">{formErrors.confirmPassword}</p>
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
            autoComplete="tel"
            className={formErrors.phone ? "border-destructive" : ""}
          />
        </div>
        {formErrors.phone && (
          <p className="text-sm text-destructive">{formErrors.phone}</p>
        )}
        <p className="text-xs text-muted-foreground">ใส่เบอร์โทรศัพท์ 10 หลัก</p>
      </div>

      {/* ประเภทที่อยู่อาศัย */}
      <div className="space-y-2">
        <Label htmlFor="residenceType">
          ประเภทที่อยู่อาศัย <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.residenceType}
          onValueChange={handleResidenceTypeChange}
          disabled={isLoading}
        >
          <SelectTrigger 
            className={formErrors.residenceType ? "border-destructive/40" : ""}
          >
            <SelectValue placeholder="เลือกประเภทที่อยู่อาศัย" />
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
      {showOtherInput && (
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="residenceTypeOther">
            ระบุประเภทที่อยู่อาศัย <span className="text-destructive">*</span>
          </Label>
          <Input
            id="residenceTypeOther"
            name="residenceTypeOther"
            type="text"
            placeholder="เช่น หอพัก, ห้องเช่า"
            value={formData.residenceTypeOther}
            onChange={handleChange}
            disabled={isLoading}
            required
            maxLength={50}
            className={!formData.residenceTypeOther && formErrors.residenceType ? "border-destructive/40" : ""}
          />
        </div>
      )}
    </div>
  )
}
