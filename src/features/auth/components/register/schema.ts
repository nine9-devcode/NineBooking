// components/register/schema.ts
import { z } from "zod"

import { registerSchema } from "@/features/auth/schema"

/**
 * Schema ของฟอร์มสมัครสมาชิก = ชุดที่ API รับ + ฟิลด์ที่มีไว้ให้ UI เท่านั้น
 *
 * ต่อยอดจาก registerSchema ตัวเดียวกับที่ API ใช้ เพื่อไม่ให้กฎสองฝั่งเลื่อนออกจากกัน
 * (ของเดิมเป็นสอง schema แยกกัน ฟอร์มบังคับ 06/08/09 แต่ API รับ 0 + เก้าหลักอะไรก็ได้)
 */
export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),

    // ใช้กับ dropdown ที่อยู่เท่านั้น ไม่ได้ส่งไป API
    provinceCode: z.string().optional(),
    districtCode: z.string().optional(),
    subdistrictCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  })

export type RegisterFormValues = z.infer<typeof registerFormSchema>

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
