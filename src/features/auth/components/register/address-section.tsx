// components/register/address-section.tsx
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
import { 
  provinces,
  type District, 
  type SubDistrict 
} from "@/lib/thailand-addresses"
import { RegisterFormValues, RegisterFormErrors } from "./schema"

interface AddressSectionProps {
  formData: RegisterFormValues
  formErrors: RegisterFormErrors
  isLoading: boolean
  filteredDistricts: District[]
  filteredSubDistricts: SubDistrict[]
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleProvinceChange: (value: string) => void
  handleDistrictChange: (value: string) => void
  handleSubDistrictChange: (value: string) => void
}

export function AddressSection({
  formData,
  formErrors,
  isLoading,
  filteredDistricts,
  filteredSubDistricts,
  handleChange,
  handleProvinceChange,
  handleDistrictChange,
  handleSubDistrictChange,
}: AddressSectionProps) {
  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-info/10 text-info p-3 rounded-md text-sm">
        💡 ข้อมูลที่อยู่เป็นทางเลือก สามารถข้ามไปสมัครได้เลย หรือเพิ่มภายหลังในหน้าโปรไฟล์
      </div>

      {/* ที่อยู่ */}
      <div className="space-y-2">
        <Label htmlFor="address">
          ที่อยู่
          <span className="text-xs text-muted-foreground ml-1">(ไม่บังคับ)</span>
          {formData.address && (
            <span className="text-xs text-muted-foreground ml-2">
              ({formData.address.length}/200)
            </span>
          )}
        </Label>
        <Input
          id="address"
          name="address"
          type="text"
          placeholder="บ้านเลขที่, ถนน, ซอย"
          value={formData.address}
          onChange={handleChange}
          disabled={isLoading}
          maxLength={200}
          className={formErrors.address ? "border-destructive/40" : ""}
        />
        {formErrors.address && (
          <p className="text-sm text-destructive">{formErrors.address}</p>
        )}
        <p className="text-xs text-muted-foreground">
          ถ้ากรอก ต้องมีอย่างน้อย 5 ตัวอักษร
        </p>
      </div>

      {/* จังหวัด & อำเภอ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="province">
            จังหวัด
            <span className="text-xs text-muted-foreground ml-1">(ไม่บังคับ)</span>
          </Label>
          <Select
            value={formData.provinceCode}
            onValueChange={handleProvinceChange}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกจังหวัด" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province.id} value={province.code.toString()}>
                  {province.nameTh}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">
            อำเภอ/เขต
            <span className="text-xs text-muted-foreground ml-1">(ไม่บังคับ)</span>
          </Label>
          <Select
            value={formData.districtCode}
            onValueChange={handleDistrictChange}
            disabled={isLoading || !formData.provinceCode}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกอำเภอ/เขต" />
            </SelectTrigger>
            <SelectContent>
              {filteredDistricts.map((district) => (
                <SelectItem key={district.id} value={district.code.toString()}>
                  {district.nameTh}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ตำบล & รหัสไปรษณีย์ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subDistrict">
            ตำบล/แขวง
            <span className="text-xs text-muted-foreground ml-1">(ไม่บังคับ)</span>
          </Label>
          <Select
            value={formData.subdistrictCode}
            onValueChange={handleSubDistrictChange}
            disabled={isLoading || !formData.districtCode}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกตำบล/แขวง" />
            </SelectTrigger>
            <SelectContent>
              {filteredSubDistricts.map((subDistrict) => (
                <SelectItem key={subDistrict.id} value={subDistrict.code.toString()}>
                  {subDistrict.nameTh}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">
            รหัสไปรษณีย์
            <span className="text-xs text-muted-foreground ml-1">(ไม่บังคับ)</span>
          </Label>
          <Input
            id="postalCode"
            name="postalCode"
            type="text"
            placeholder="รหัสไปรษณีย์"
            value={formData.postalCode}
            disabled
            className="bg-muted"
          />
        </div>
      </div>
    </div>
  )
}
