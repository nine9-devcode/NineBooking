// components/register/use-register.ts
import { useState, useCallback } from "react"
import { 
  provinces, 
  getDistrictsByProvinceCode, 
  getSubDistrictsByDistrictCode,
  getPostalCodeBySubDistrictCode,
  type District,
  type SubDistrict
} from "@/lib/thailand-addresses"
import { 
  RegisterFormValues, 
  RegisterFormErrors,
  defaultRegisterValues, 
  defaultRegisterErrors,
} from "./schema"

export function useRegister() {
  // Form Data
  const [formData, setFormData] = useState<RegisterFormValues>(defaultRegisterValues)
  
  // Form Errors
  const [formErrors, setFormErrors] = useState<RegisterFormErrors>(defaultRegisterErrors)
  
  // Filtered Options for Address
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([])
  const [filteredSubDistricts, setFilteredSubDistricts] = useState<SubDistrict[]>([])


  // Validate field
  const validateField = useCallback((name: string, value: string, allValues?: RegisterFormValues): string => {
    const data = allValues || formData
    
    switch (name) {
      case "name":
        if (value.length === 0) return ""
        if (value.length < 3) return "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร"
        if (value.length > 40) return "ชื่อต้องไม่เกิน 40 ตัวอักษร"
        if (!/^[ก-๙a-zA-Z\s]+$/.test(value)) return "ชื่อต้องเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น"
        return ""
        
      case "nickname":
        if (value.length === 0) return "กรุณากรอกชื่อเล่น"
        if (value.length > 20) return "ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร"
        return ""

      case "email":
        if (value.length === 0) return ""
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return "รูปแบบอีเมลไม่ถูกต้อง"
        return ""

      case "password":
        if (value.length === 0) return ""
        if (value.length < 6) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
        if (value.length > 50) return "รหัสผ่านต้องไม่เกิน 50 ตัวอักษร"
        return ""

      case "confirmPassword":
        if (value.length === 0) return ""
        if (value !== data.password) return "รหัสผ่านไม่ตรงกัน"
        return ""

      case "phone":
        if (value.length === 0) return ""
        if (!/^\d+$/.test(value)) return "เบอร์โทรต้องเป็นตัวเลขเท่านั้น"
        if (!/^0[689]\d{8}$/.test(value)) return "รูปแบบเบอร์โทรไม่ถูกต้อง"
        return ""

      case "address":
        if (value.length > 0 && value.length < 5) return "ที่อยู่ต้องมีอย่างน้อย 5 ตัวอักษร"
        if (value.length > 200) return "ที่อยู่ต้องไม่เกิน 200 ตัวอักษร"
        return ""

      default:
        return ""
    }
  }, [formData])

  // จัดการ input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Special handling for phone (only numbers, max 10)
    if (name === "phone") {
      const numbersOnly = value.replace(/\D/g, "").slice(0, 10)
      setFormData(prev => ({ ...prev, [name]: numbersOnly }))
      setFormErrors(prev => ({ ...prev, [name]: validateField(name, numbersOnly) }))
      return
    }

    // Special handling for name (max 40 chars)
    if (name === "name" && value.length > 40) return

    // Special handling for nickname (max 20 chars)
    if (name === "nickname" && value.length > 20) return

    // Special handling for address (max 200 chars)
    if (name === "address" && value.length > 200) return

    // Update form data
    const newFormData = { ...formData, [name]: value }
    setFormData(newFormData)
    
    // Validate field
    if (name in formErrors) {
      setFormErrors(prev => ({ 
        ...prev, 
        [name]: validateField(name, value, newFormData) 
      }))
    }

    // Re-validate confirmPassword when password changes
    if (name === "password" && formData.confirmPassword) {
      setFormErrors(prev => ({
        ...prev,
        confirmPassword: value !== formData.confirmPassword ? "รหัสผ่านไม่ตรงกัน" : ""
      }))
    }
  }, [formData, formErrors, validateField])

  // เลือกประเภทที่อยู่อาศัย
  const handleResidenceTypeChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      residenceType: value,
      // Clear "other" input if not selecting "other"
      residenceTypeOther: value === "other" ? prev.residenceTypeOther : "",
    }))
    setFormErrors(prev => ({ ...prev, residenceType: "" }))
  }, [])

  // เลือกจังหวัด
  const handleProvinceChange = useCallback((value: string) => {
    const provinceCode = parseInt(value)
    const province = provinces.find(p => p.code === provinceCode)
    
    setFormData(prev => ({
      ...prev,
      provinceCode: value,
      province: province?.nameTh || "",
      districtCode: "",
      district: "",
      subdistrictCode: "",
      subDistrict: "",
      postalCode: "",
    }))
    
    setFilteredDistricts(getDistrictsByProvinceCode(provinceCode))
    setFilteredSubDistricts([])
  }, [])

  // เลือกอำเภอ
  const handleDistrictChange = useCallback((value: string) => {
    const districtCode = parseInt(value)
    const district = filteredDistricts.find(d => d.code === districtCode)
    
    setFormData(prev => ({
      ...prev,
      districtCode: value,
      district: district?.nameTh || "",
      subdistrictCode: "",
      subDistrict: "",
      postalCode: "",
    }))
    
    setFilteredSubDistricts(getSubDistrictsByDistrictCode(districtCode))
  }, [filteredDistricts])

  // เลือกตำบล
  const handleSubDistrictChange = useCallback((value: string) => {
    const subdistrictCode = parseInt(value)
    const subDistrict = filteredSubDistricts.find(sd => sd.code === subdistrictCode)
    const postalCode = getPostalCodeBySubDistrictCode(subdistrictCode)
    
    setFormData(prev => ({
      ...prev,
      subdistrictCode: value,
      subDistrict: subDistrict?.nameTh || "",
      postalCode: postalCode.toString(),
    }))
  }, [filteredSubDistricts])

  // Validate step 1
  const validateStep1 = useCallback((): boolean => {
    let hasError = false
    const newErrors = { ...defaultRegisterErrors }

    // Required: name
    if (!formData.name) {
      newErrors.name = "กรุณากรอกชื่อ-นามสกุล"
      hasError = true
    } else {
      const nameError = validateField("name", formData.name)
      if (nameError) {
        newErrors.name = nameError
        hasError = true
      }
    }

    // Required: nickname
    if (!formData.nickname) {
      newErrors.nickname = "กรุณากรอกชื่อเล่น"
      hasError = true
    }

    // Required: email
    if (!formData.email) {
      newErrors.email = "กรุณากรอกอีเมล"
      hasError = true
    } else {
      const emailError = validateField("email", formData.email)
      if (emailError) {
        newErrors.email = emailError
        hasError = true
      }
    }

    // Required: password
    if (!formData.password) {
      newErrors.password = "กรุณากรอกรหัสผ่าน"
      hasError = true
    } else {
      const passwordError = validateField("password", formData.password)
      if (passwordError) {
        newErrors.password = passwordError
        hasError = true
      }
    }

    // Required: confirmPassword
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "กรุณายืนยันรหัสผ่าน"
      hasError = true
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน"
      hasError = true
    }

    // Required: phone
    if (!formData.phone) {
      newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์"
      hasError = true
    } else {
      const phoneError = validateField("phone", formData.phone)
      if (phoneError) {
        newErrors.phone = phoneError
        hasError = true
      }
    }

    // Required: residenceType
    if (!formData.residenceType) {
      newErrors.residenceType = "กรุณาเลือกประเภทที่อยู่อาศัย"
      hasError = true
    } else if (formData.residenceType === "other" && !formData.residenceTypeOther?.trim()) {
      newErrors.residenceType = "กรุณาระบุประเภทที่อยู่อาศัย"
      hasError = true
    }

    setFormErrors(newErrors)
    return !hasError
  }, [formData, validateField])

  // Validate step 2
  const validateStep2 = useCallback((): boolean => {
    // Address is optional, but if filled, validate it
    if (formData.address && formData.address.length > 0) {
      const addressError = validateField("address", formData.address)
      if (addressError) {
        setFormErrors(prev => ({ ...prev, address: addressError }))
        return false
      }
    }
    return true
  }, [formData.address, validateField])


  // ดึงค่า residenceType สุดท้าย
  const getFinalResidenceType = useCallback((): string => {
    if (formData.residenceType === "other") {
      return formData.residenceTypeOther?.trim() || ""
    }
    return formData.residenceType
  }, [formData.residenceType, formData.residenceTypeOther])

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(defaultRegisterValues)
    setFormErrors(defaultRegisterErrors)
    setFilteredDistricts([])
    setFilteredSubDistricts([])
  }, [])

  return {
    // Form Data & Errors
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    
    // Address Options
    filteredDistricts,
    filteredSubDistricts,
    provinces,
    
    
    // Handlers
    handleChange,
    handleResidenceTypeChange,
    handleProvinceChange,
    handleDistrictChange,
    handleSubDistrictChange,
    
    // Validation
    validateStep1,
    validateStep2,
    validateField,
    getFinalResidenceType,
    
    // Reset
    resetForm,
  }
}
