// components/admin/users/edit-user-modal/schema.ts
import { z } from "zod"

export const editUserSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(40, "ชื่อต้องไม่เกิน 40 ตัวอักษร"),
  nickname: z.string().min(1, "กรุณากรอกชื่อเล่น").max(20, "ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  phone: z
    .string()
    .length(10, "เบอร์โทรต้องเป็น 10 หลัก")
    .regex(/^[0-9]+$/, "เบอร์โทรต้องเป็นตัวเลขเท่านั้น"),
  memberType: z.string().min(1, "กรุณาเลือกประเภทสมาชิก"),
  memberTypeNote: z.string().optional(),
  residenceType: z.string().min(1, "กรุณาเลือกประเภทที่อยู่อาศัย"),
  address: z.string().optional(),
  // ชื่อจังหวัด/อำเภอ/ตำบล (บันทึกลง DB)
  province: z.string().optional(), // ชื่อจังหวัด (บันทึกลง DB)
  district: z.string().optional(), // ชื่ออำเภอ (บันทึกลง DB)
  subDistrict: z.string().optional(), // ชื่อตำบล (บันทึกลง DB)
  postalCode: z.string().optional(), // รหัสไปรษณีย์
  // Code สำหรับ dropdown (ไม่บันทึกลง DB)
  provinceCode: z.string().optional(),
  districtCode: z.string().optional(),
  subDistrictCode: z.string().optional(),
})

export type EditUserFormValues = z.infer<typeof editUserSchema>

export interface EditUserModalProps {
  isOpen: boolean
  user: {
    id: string
    name: string | null
    nickname: string | null
    email: string | null
    phone: string | null
    memberType: string | null
    memberTypeNote: string | null
    residenceType: string | null
    address: string | null
    province: string | null
    district: string | null
    subDistrict: string | null
    postalCode: string | null
  } | null
  onClose: () => void
  onSave: (data: EditUserFormValues) => void
  isLoading: boolean
}
