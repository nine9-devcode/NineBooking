// components/admin/users/edit-user-modal/use-address.ts
import { useMemo } from "react"
import { UseFormReturn } from "react-hook-form"
import { 
  provinces,
  districts, 
  subDistricts 
} from "@/lib/thailand-addresses"
import { EditUserFormValues } from "./schema"

export function useAddress(form: UseFormReturn<EditUserFormValues>) {
  const watchedProvinceCode = form.watch("provinceCode")
  const watchedDistrictCode = form.watch("districtCode")

  const filteredDistricts = useMemo(() => {
    if (!watchedProvinceCode) return []
    return districts.filter((d) => d.provinceCode.toString() === watchedProvinceCode)
  }, [watchedProvinceCode])

  const filteredSubDistricts = useMemo(() => {
    if (!watchedDistrictCode) return []
    return subDistricts.filter((sd) => sd.districtCode.toString() === watchedDistrictCode)
  }, [watchedDistrictCode])

  // เลือกจังหวัด
  const handleProvinceChange = (code: string) => {
    const province = provinces.find(p => p.code.toString() === code)
    
    form.setValue("provinceCode", code)
    form.setValue("province", province?.nameTh || "")
    // Reset ลูก
    form.setValue("districtCode", "")
    form.setValue("district", "")
    form.setValue("subDistrictCode", "")
    form.setValue("subDistrict", "")
    form.setValue("postalCode", "")
  }

  // เลือกอำเภอ
  const handleDistrictChange = (code: string) => {
    const district = districts.find(d => d.code.toString() === code)
    
    form.setValue("districtCode", code)
    form.setValue("district", district?.nameTh || "")
    // Reset ลูก
    form.setValue("subDistrictCode", "")
    form.setValue("subDistrict", "")
    form.setValue("postalCode", "")
  }

  // เลือกตำบล
  const handleSubDistrictChange = (code: string) => {
    const subDistrict = subDistricts.find(sd => sd.code.toString() === code)
    
    form.setValue("subDistrictCode", code)
    form.setValue("subDistrict", subDistrict?.nameTh || "")
    form.setValue("postalCode", subDistrict?.postalCode.toString() || "")
  }

  return {
    watchedProvinceCode,
    watchedDistrictCode,
    filteredDistricts,
    filteredSubDistricts,
    handleProvinceChange,
    handleDistrictChange,
    handleSubDistrictChange,
  }
}