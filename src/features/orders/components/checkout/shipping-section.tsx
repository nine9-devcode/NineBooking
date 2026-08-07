// components/checkout/shipping-section.tsx
"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin, Home } from "lucide-react"
import { CheckoutFormData } from "@/features/orders/checkout.types"
import { getResidenceTypeLabel } from "@/lib/constants"
import {
  provinces,
  getDistrictsByProvinceCode,
  getSubDistrictsByDistrictCode,
} from "@/lib/thailand-addresses"

interface ShippingSectionProps {
  formData: CheckoutFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectChange?: (field: string, value: string) => void
  isLoading: boolean
}

export function ShippingSection({
  formData,
  onChange,
  onSelectChange,
  isLoading,
}: ShippingSectionProps) {
  // Local state สำหรับ Select codes
  const [provinceCode, setProvinceCode] = useState<string>("")
  const [districtCode, setDistrictCode] = useState<string>("")
  const [subdistrictCode, setSubdistrictCode] = useState<string>("")

  // Filtered lists
  const [filteredDistricts, setFilteredDistricts] = useState<any[]>([])
  const [filteredSubDistricts, setFilteredSubDistricts] = useState<any[]>([])

  useEffect(() => {
    // ฟังก์ชันสำหรับตั้งค่าเริ่มต้น
    const initializeAddress = () => {
      if (!formData.shippingProvince) return;

      // 1. หาจังหวัด (Logic เดียวกับ Modal)
      const foundProvince = provinces.find(
        (p) => p.nameTh === formData.shippingProvince || p.nameEn === formData.shippingProvince
      );

      if (foundProvince) {
        const pCode = foundProvince.code.toString();
        setProvinceCode(pCode);
        
        // โหลดอำเภอ
        const districts = getDistrictsByProvinceCode(foundProvince.code);
        setFilteredDistricts(districts);

        // 2. หาอำเภอ
        if (formData.shippingDistrict) {
          const foundDistrict = districts.find(
            (d) => d.nameTh === formData.shippingDistrict || d.nameEn === formData.shippingDistrict
          );

          if (foundDistrict) {
            const dCode = foundDistrict.code.toString();
            setDistrictCode(dCode);
            
            // โหลดตำบล
            const subDistricts = getSubDistrictsByDistrictCode(foundDistrict.code);
            setFilteredSubDistricts(subDistricts);

            // 3. หาตำบล
            if (formData.shippingSubDistrict) {
              const foundSubDistrict = subDistricts.find(
                (sd) => sd.nameTh === formData.shippingSubDistrict || sd.nameEn === formData.shippingSubDistrict
              );

              if (foundSubDistrict) {
                setSubdistrictCode(foundSubDistrict.code.toString());
                
                // Auto-fill Postal Code ถ้ายังไม่มี
                if (!formData.shippingPostalCode && onSelectChange) {
                   onSelectChange("shippingPostalCode", foundSubDistrict.postalCode.toString());
                }
              }
            }
          }
        }
      } else {
        console.warn("Province not found in list:", formData.shippingProvince);
      }
    };

    // ทำงานเมื่อ formData มีค่า และ state ยังว่างอยู่ (ป้องกัน Loop)
    if (formData.shippingProvince && !provinceCode) {
      initializeAddress();
    }
  }, [formData.shippingProvince, formData.shippingDistrict, formData.shippingSubDistrict, provinceCode]);

  // เมื่อเลือกจังหวัด (Reset ลูกโซ่)
  const handleProvinceChange = (value: string) => {
    const code = parseInt(value)
    setProvinceCode(value)
    setDistrictCode("")      
    setSubdistrictCode("")   

    const districts = getDistrictsByProvinceCode(code)
    setFilteredDistricts(districts)
    setFilteredSubDistricts([])

    const selectedProvince = provinces.find(p => p.code === code)
    if (selectedProvince && onSelectChange) {
      onSelectChange("shippingProvince", selectedProvince.nameTh)
      onSelectChange("shippingDistrict", "")
      onSelectChange("shippingSubDistrict", "")
      onSelectChange("shippingPostalCode", "")
    }
  }

  // เมื่อเลือกอำเภอ
  const handleDistrictChange = (value: string) => {
    const code = parseInt(value)
    setDistrictCode(value)
    setSubdistrictCode("")   

    const subDistricts = getSubDistrictsByDistrictCode(code)
    setFilteredSubDistricts(subDistricts)

    const selectedDistrict = filteredDistricts.find(d => d.code === code)
    if (selectedDistrict && onSelectChange) {
      onSelectChange("shippingDistrict", selectedDistrict.nameTh)
      onSelectChange("shippingSubDistrict", "")
      onSelectChange("shippingPostalCode", "")
    }
  }

  // เมื่อเลือกตำบล
  const handleSubDistrictChange = (value: string) => {
    const code = parseInt(value)
    setSubdistrictCode(value)

    const selectedSubDistrict = filteredSubDistricts.find(sd => sd.code === code)
    if (selectedSubDistrict && onSelectChange) {
      onSelectChange("shippingSubDistrict", selectedSubDistrict.nameTh)
      onSelectChange("shippingPostalCode", selectedSubDistrict.postalCode.toString())
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">ที่อยู่จัดส่ง</h2>
      </div>

      <div className="space-y-4">
        {/* ประเภทที่อยู่อาศัย */}
        <div>
          <Label htmlFor="shippingResidenceType">
            <Home className="w-4 h-4 inline mr-1" />
            ประเภทที่อยู่อาศัย
          </Label>
          <Input
            id="shippingResidenceType"
            name="shippingResidenceType"
            value={
              formData.shippingResidenceType
                ? getResidenceTypeLabel(formData.shippingResidenceType)
                : ""
            }
            disabled
            className="bg-muted text-muted-foreground"
            placeholder="(ไม่มีข้อมูล)"
          />
        </div>

        {/* ที่อยู่ */}
        <div>
          <Label htmlFor="shippingAddress">ที่อยู่</Label>
          <Input
            id="shippingAddress"
            name="shippingAddress"
            value={formData.shippingAddress}
            onChange={onChange}
            placeholder="บ้านเลขที่, ถนน, ซอย"
            disabled={isLoading}
          />
        </div>

        {/* จังหวัด & อำเภอ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>จังหวัด</Label>
            <Select
              value={provinceCode}
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
            <Label>อำเภอ/เขต</Label>
            <Select
              value={districtCode}
              onValueChange={handleDistrictChange}
              disabled={isLoading || !provinceCode}
            >
              <SelectTrigger>
                <SelectValue placeholder={provinceCode ? "เลือกอำเภอ/เขต" : "เลือกจังหวัดก่อน"} />
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
            <Label>ตำบล/แขวง</Label>
            <Select
              value={subdistrictCode}
              onValueChange={handleSubDistrictChange}
              disabled={isLoading || !districtCode}
            >
              <SelectTrigger>
                <SelectValue placeholder={districtCode ? "เลือกตำบล/แขวง" : "เลือกอำเภอก่อน"} />
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
            <Label>รหัสไปรษณีย์</Label>
            <Input
              id="shippingPostalCode"
              name="shippingPostalCode"
              value={formData.shippingPostalCode}
              disabled
              className="bg-muted"
            />
          </div>
        </div>
      </div>
    </div>
  )
}