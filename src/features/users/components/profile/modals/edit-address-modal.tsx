"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  provinces,
  getDistrictsByProvinceCode,
  getSubDistrictsByDistrictCode,
  getPostalCodeBySubDistrictCode,
  type District,
  type SubDistrict,
} from "@/lib/thailand-addresses"
import { toast } from "sonner"
import { RESIDENCE_TYPES, isPredefinedResidenceType } from "@/lib/constants"

interface UserProfile {
  address: string | null
  province: string | null
  district: string | null
  subDistrict: string | null
  postalCode: string | null
  residenceType: string | null
}

interface EditAddressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: UserProfile
  onSuccess: () => void
}

export function EditAddressModal({ open, onOpenChange, profile, onSuccess }: EditAddressModalProps) {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    address: "",
    province: "",
    district: "",
    subDistrict: "",
    postalCode: "",
    residenceType: "",
    residenceTypeOther: "",
    // เก็บ Code ไว้สำหรับ dropdown logic
    provinceCode: "",
    districtCode: "",
    subDistrictCode: "",
  })

  const showOtherInput = formData.residenceType === "other"

  // Filtered Lists
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([])
  const [filteredSubDistricts, setFilteredSubDistricts] = useState<SubDistrict[]>([])

  // Load initial data when open
  useEffect(() => {
    if (open && profile) {
      // 1. Set text fields
      const isPredefined = profile.residenceType ? isPredefinedResidenceType(profile.residenceType) : true

      const initialState = {
        address: profile.address || "",
        province: profile.province || "",
        district: profile.district || "",
        subDistrict: profile.subDistrict || "",
        postalCode: profile.postalCode || "",
        residenceType: isPredefined ? (profile.residenceType || "") : "other",
        residenceTypeOther: isPredefined ? "" : (profile.residenceType || ""),
        provinceCode: "",
        districtCode: "",
        subDistrictCode: "",
      }

      // 2. Try to reverse-lookup codes based on names
      if (profile.province) {
        const p = provinces.find(p => p.nameTh === profile.province)
        if (p) {
          initialState.provinceCode = p.code.toString()
          // Load districts
          const dists = getDistrictsByProvinceCode(p.code)
          setFilteredDistricts(dists)

          if (profile.district) {
            const d = dists.find(d => d.nameTh === profile.district)
            if (d) {
              initialState.districtCode = d.code.toString()
              // Load subdistricts
              const subs = getSubDistrictsByDistrictCode(d.code)
              setFilteredSubDistricts(subs)

              if (profile.subDistrict) {
                const s = subs.find(s => s.nameTh === profile.subDistrict)
                if (s) {
                  initialState.subDistrictCode = s.code.toString()
                }
              }
            }
          }
        }
      }

      setFormData(initialState)
    }
  }, [open, profile])

  // Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Handle Province Change
  const handleProvinceChange = (value: string) => {
    const code = parseInt(value)
    const province = provinces.find(p => p.code === code)
    
    setFormData(prev => ({
      ...prev,
      provinceCode: value,
      province: province?.nameTh || "",
      districtCode: "",
      district: "",
      subDistrictCode: "",
      subDistrict: "",
      postalCode: "",
    }))

    const districts = getDistrictsByProvinceCode(code)
    setFilteredDistricts(districts)
    setFilteredSubDistricts([])
  }

  // Handle District Change
  const handleDistrictChange = (value: string) => {
    const code = parseInt(value)
    const district = filteredDistricts.find(d => d.code === code)

    setFormData(prev => ({
      ...prev,
      districtCode: value,
      district: district?.nameTh || "",
      subDistrictCode: "",
      subDistrict: "",
      postalCode: "",
    }))

    const subDistricts = getSubDistrictsByDistrictCode(code)
    setFilteredSubDistricts(subDistricts)
  }

  // Handle SubDistrict Change
  const handleSubDistrictChange = (value: string) => {
    const code = parseInt(value)
    const subDistrict = filteredSubDistricts.find(sd => sd.code === code)
    const postalCode = getPostalCodeBySubDistrictCode(code)

    setFormData(prev => ({
      ...prev,
      subDistrictCode: value,
      subDistrict: subDistrict?.nameTh || "",
      postalCode: postalCode.toString(),
    }))
  }

  // Handle Residence Type Change
  const handleResidenceTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      residenceType: value,
      residenceTypeOther: value === "other" ? prev.residenceTypeOther : "",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Resolve residenceType
      let finalResidenceType: string | null = null
      if (formData.residenceType) {
        finalResidenceType = formData.residenceType === "other"
          ? formData.residenceTypeOther.trim()
          : formData.residenceType
      }

      // 1. บันทึกลง Database
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: formData.address,
          province: formData.province,
          district: formData.district,
          subDistrict: formData.subDistrict,
          postalCode: formData.postalCode,
          residenceType: finalResidenceType,
        }),
      })

      if (!res.ok) throw new Error("Failed to update address")

      // 3. สั่ง Update Session ทันที
      // ส่งข้อมูลใหม่เข้าไปทับข้อมูลเดิมใน Session Client-side
      await update({
        ...session,
        user: {
          ...session?.user,
          address: formData.address,
          province: formData.province,
          district: formData.district,
          subDistrict: formData.subDistrict,
          postalCode: formData.postalCode,
          residenceType: finalResidenceType,
        }
      })

      // Refresh หน้าเว็บ
      router.refresh()

      toast.success("บันทึกข้อมูลเรียบร้อยแล้ว")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>แก้ไขที่อยู่จัดส่ง</DialogTitle>
          <DialogDescription>
            ประเภทที่อยู่อาศัยและที่อยู่จัดส่งจะถูกใช้เป็นค่าเริ่มต้นในการสั่งจอง
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Residence Type */}
          <div className="space-y-2">
            <Label>ประเภทที่อยู่อาศัย</Label>
            <Select
              value={formData.residenceType}
              onValueChange={handleResidenceTypeChange}
              disabled={isLoading}
            >
              <SelectTrigger>
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
          </div>

          {showOtherInput && (
            <div className="space-y-2">
              <Label htmlFor="residenceTypeOther">ระบุประเภทที่อยู่อาศัย</Label>
              <Input
                id="residenceTypeOther"
                name="residenceTypeOther"
                type="text"
                placeholder="เช่น หอพัก, ห้องเช่า"
                value={formData.residenceTypeOther}
                onChange={handleChange}
                disabled={isLoading}
                maxLength={50}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="address">ที่อยู่ (บ้านเลขที่, หมู่, ซอย, ถนน)</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="เช่น 123/45 หมู่ 6 ถ.สุขุมวิท"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>จังหวัด</Label>
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
              <Label>อำเภอ/เขต</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ตำบล/แขวง</Label>
              <Select
                value={formData.subDistrictCode}
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
              <Label>รหัสไปรษณีย์</Label>
              <Input
                value={formData.postalCode}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}