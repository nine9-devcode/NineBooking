// components/complete-profile/schema.ts
import { z } from "zod"

// Schema สำหรับ Complete Profile
export const completeProfileSchema = z.object({
  // ข้อมูลบังคับ
  name: z
    .string()
    .min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(40, "ชื่อต้องไม่เกิน 40 ตัวอักษร")
    .regex(/^[ก-๙a-zA-Z\s]+$/, "ชื่อต้องเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น"),
  nickname: z.string().min(1, "กรุณากรอกชื่อเล่น").max(20, "ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร"),
  phone: z
    .string()
    .length(10, "เบอร์โทรต้องมี 10 หลัก")
    .regex(/^0[689]\d{8}$/, "รูปแบบเบอร์โทรไม่ถูกต้อง"),
  residenceType: z.string().min(1, "กรุณาเลือกประเภทที่อยู่อาศัย"),

  // ข้อมูลไม่บังคับ
  address: z.string().max(200, "ที่อยู่ต้องไม่เกิน 200 ตัวอักษร").optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subDistrict: z.string().optional(),
  postalCode: z.string().optional(),

  // สำหรับ dropdown state (ไม่ส่งไป API)
  provinceCode: z.string().optional(),
  districtCode: z.string().optional(),
  subdistrictCode: z.string().optional(),
})

export type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>

// ค่าเริ่มต้นของ form
export const defaultFormValues: CompleteProfileFormValues = {
  name: "",
  nickname: "",
  phone: "",
  residenceType: "",
  address: "",
  province: "",
  district: "",
  subDistrict: "",
  postalCode: "",
  provinceCode: "",
  districtCode: "",
  subdistrictCode: "",
}

// Form errors type
export interface FormErrors {
  name: string
  nickname: string
  phone: string
  residenceType: string
  address: string
}

export const defaultFormErrors: FormErrors = {
  name: "",
  nickname: "",
  phone: "",
  residenceType: "",
  address: "",
}
