// components/register/schema.ts
import { z } from "zod"

// Schema สำหรับ Register
export const registerSchema = z.object({
  // ข้อมูลบังคับ - Step 1
  name: z.string()
    .min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(40, "ชื่อต้องไม่เกิน 40 ตัวอักษร")
    .regex(/^[ก-๙a-zA-Z\s]+$/, "ชื่อต้องเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น"),
  nickname: z.string()
    .min(1, "กรุณากรอกชื่อเล่น")
    .max(20, "ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร"),
  email: z.string()
    .min(1, "กรุณากรอกอีเมล")
    .email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string()
    .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
    .max(50, "รหัสผ่านต้องไม่เกิน 50 ตัวอักษร"),
  confirmPassword: z.string()
    .min(1, "กรุณายืนยันรหัสผ่าน"),
  phone: z.string()
    .length(10, "เบอร์โทรต้องมี 10 หลัก")
    .regex(/^0[689]\d{8}$/, "รูปแบบเบอร์โทรไม่ถูกต้อง"),
  residenceType: z.string()
    .min(1, "กรุณาเลือกประเภทที่อยู่อาศัย"),
  residenceTypeOther: z.string().optional(),
  
  // ข้อมูลไม่บังคับ - Step 2 (ที่อยู่)
  address: z.string().max(200, "ที่อยู่ต้องไม่เกิน 200 ตัวอักษร").optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subDistrict: z.string().optional(),
  postalCode: z.string().optional(),
  
  // สำหรับ dropdown state (ไม่ส่งไป API)
  provinceCode: z.string().optional(),
  districtCode: z.string().optional(),
  subdistrictCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
})

export type RegisterFormValues = z.infer<typeof registerSchema>

// ค่าเริ่มต้นของ form
export const defaultRegisterValues: RegisterFormValues = {
  name: "",
  nickname: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  residenceType: "",
  residenceTypeOther: "",
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
export interface RegisterFormErrors {
  name: string
  nickname: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  residenceType: string
  address: string
}

export const defaultRegisterErrors: RegisterFormErrors = {
  name: "",
  nickname: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  residenceType: "",
  address: "",
}
