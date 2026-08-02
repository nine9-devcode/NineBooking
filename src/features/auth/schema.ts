import { z } from "zod"

// ===== Phase 6.1: Registration Improvements =====

// Register Schema - Step 1 (Basic Info)
export const registerStep1Schema = z.object({
  name: z
    .string()
    .min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(40, "ชื่อต้องไม่เกิน 40 ตัวอักษร")
    .regex(/^[ก-๙a-zA-Z\s]+$/, "ชื่อต้องเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น"),
  
  nickname: z
    .string()
    .min(1, "กรุณากรอกชื่อเล่น")
    .max(20, "ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร"),
  
  email: z
    .string()
    .min(1, "กรุณากรอกอีเมล")
    .email("รูปแบบอีเมลไม่ถูกต้อง"),
  
  password: z
    .string()
    .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
    .max(50, "รหัสผ่านต้องไม่เกิน 50 ตัวอักษร"),
  
  confirmPassword: z.string(),
  
  phone: z
    .string()
    .regex(/^0\d{9}$/, "เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 10 หลัก")
    .length(10, "เบอร์โทรต้องมี 10 หลัก"),
  
  residenceType: z
    .string()
    .min(1, "กรุณาเลือกประเภทที่อยู่อาศัย"),
    
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
})

// Register Schema - Step 2 (Address)
export const registerStep2Schema = z.object({
  address: z
    .string()
    .max(200, "ที่อยู่ต้องไม่เกิน 200 ตัวอักษร")
    .optional()
    .or(z.literal("")),
  
  province: z
    .string()
    .optional()
    .or(z.literal("")),
  
  district: z
    .string()
    .optional()
    .or(z.literal("")),
  
  subDistrict: z
    .string()
    .optional()
    .or(z.literal("")),
  
  postalCode: z
    .string()
    .regex(/^(\d{5})?$/, "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก")
    .optional()
    .or(z.literal("")),
})

// Complete Register Schema - สำหรับ API
export const registerSchema = z.object({
  name: z
    .string()
    .min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(40, "ชื่อต้องไม่เกิน 40 ตัวอักษร"),
  
  nickname: z
    .string()
    .min(1, "กรุณากรอกชื่อเล่น")
    .max(20, "ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร"),
  
  email: z
    .string()
    .min(1, "กรุณากรอกอีเมล")
    .email("รูปแบบอีเมลไม่ถูกต้อง"),
  
  password: z
    .string()
    .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
    .max(50, "รหัสผ่านต้องไม่เกิน 50 ตัวอักษร"),
  
  phone: z
    .string()
    .regex(/^0\d{9}$/, "เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 10 หลัก"),
  
  residenceType: z
    .string()
    .min(1, "กรุณาเลือกประเภทที่อยู่อาศัย"),
  
  // Optional address fields
  address: z.string().optional().or(z.literal("")),
  province: z.string().optional().or(z.literal("")),
  district: z.string().optional().or(z.literal("")),
  subDistrict: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
})

// Complete Profile Schema — ใช้ตอนผู้ใช้กรอกข้อมูลที่ยังไม่ครบ
export const completeProfileSchema = z.object({
  name: z.string()
    .min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(40, "ชื่อต้องไม่เกิน 40 ตัวอักษร")
    .regex(/^[ก-๙a-zA-Z\s]+$/, "ชื่อต้องเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น"),
  nickname: z.string()
    .min(1, "กรุณากรอกชื่อเล่น")
    .max(20, "ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร"),
  phone: z.string()
    .length(10, "เบอร์โทรต้องมี 10 หลัก")
    .regex(/^0\d{9}$/, "เบอร์โทรต้องขึ้นต้นด้วย 0"),
  residenceType: z.string().min(1, "กรุณาเลือกประเภทที่อยู่อาศัย"),
  
  // Optional address fields
  address: z.string().max(200).optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subDistrict: z.string().optional(),
  postalCode: z.string().optional(),
})

// Update Profile Schema (สำหรับหน้า Profile - existing users)
// ทุก field เป็น optional เพราะ existing users ไม่บังคับกรอก
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(40, "ชื่อต้องไม่เกิน 40 ตัวอักษร")
    .optional()
    .or(z.literal("")),
  
  nickname: z
    .string()
    .max(20, "ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร")
    .optional()
    .or(z.literal("")),
  
  phone: z
    .string()
    .regex(/^0\d{9}$/, "เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 10 หลัก")
    .optional()
    .or(z.literal("")),
  
  residenceType: z
    .string()
    .optional()
    .or(z.literal("")),
  
  address: z
    .string()
    .max(200, "ที่อยู่ต้องไม่เกิน 200 ตัวอักษร")
    .optional()
    .or(z.literal("")),
  
  province: z.string().optional().or(z.literal("")),
  district: z.string().optional().or(z.literal("")),
  subDistrict: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
})

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "กรุณากรอกอีเมล")
    .email("รูปแบบอีเมลไม่ถูกต้อง"),
  
  password: z
    .string()
    .min(1, "กรุณากรอกรหัสผ่าน"),
})

// Types
export type RegisterStep1Input = z.infer<typeof registerStep1Schema>
export type RegisterStep2Input = z.infer<typeof registerStep2Schema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type LoginInput = z.infer<typeof loginSchema>