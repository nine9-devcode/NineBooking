import { z } from "zod"

/**
 * Schema กลางของฟีเจอร์ auth — ใช้ร่วมกันทั้งฟอร์มฝั่งหน้าเว็บและ API
 *
 * เดิมแยกกันคนละไฟล์แล้วกฎไม่ตรงกัน: ฟอร์มบังคับเบอร์มือถือ (06/08/09)
 * แต่ API รับเลข 0 ตามด้วยเก้าหลักอะไรก็ได้ และฟิลด์ residenceTypeOther
 * ที่ฟอร์มเก็บมาก็ไม่มีใน schema ฝั่ง API ค่าจึงหายไปเงียบๆ
 * ทั้งที่คอลัมน์ในฐานข้อมูลมีอยู่
 */

// ── ชิ้นส่วนที่ใช้ซ้ำ ──

const nameSchema = z
  .string()
  .trim()
  .min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร")
  .max(40, "ชื่อต้องไม่เกิน 40 ตัวอักษร")
  .regex(/^[ก-๙a-zA-Z\s]+$/, "ชื่อต้องเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น")

const nicknameSchema = z
  .string()
  .trim()
  .min(1, "กรุณากรอกชื่อเล่น")
  .max(20, "ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร")

const emailSchema = z.string().trim().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง")

const passwordSchema = z
  .string()
  .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
  .max(50, "รหัสผ่านต้องไม่เกิน 50 ตัวอักษร")

/** เบอร์มือถือไทย — ขึ้นต้น 06 / 08 / 09 เท่านั้น */
export const thaiMobileSchema = z
  .string()
  .regex(/^0[689]\d{8}$/, "เบอร์โทรต้องเป็นมือถือ 10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09")

const optionalText = z.string().optional().or(z.literal(""))

const addressFields = {
  address: z.string().max(200, "ที่อยู่ต้องไม่เกิน 200 ตัวอักษร").optional().or(z.literal("")),
  province: optionalText,
  district: optionalText,
  subDistrict: optionalText,
  postalCode: z
    .string()
    .regex(/^(\d{5})?$/, "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก")
    .optional()
    .or(z.literal("")),
}

// ── สมัครสมาชิก ──

/** ชุดฟิลด์ที่ API รับจริง — ฟอร์มฝั่งหน้าเว็บต่อยอดจากตัวนี้ */
export const registerSchema = z.object({
  name: nameSchema,
  nickname: nicknameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: thaiMobileSchema,
  residenceType: z.string().min(1, "กรุณาเลือกประเภทที่อยู่อาศัย"),
  residenceTypeOther: z.string().max(100).optional().or(z.literal("")),
  ...addressFields,
})

// ── กรอกโปรไฟล์ให้ครบ ──

export const completeProfileSchema = z.object({
  name: nameSchema,
  nickname: nicknameSchema,
  phone: thaiMobileSchema,
  residenceType: z.string().min(1, "กรุณาเลือกประเภทที่อยู่อาศัย"),
  residenceTypeOther: z.string().max(100).optional().or(z.literal("")),
  ...addressFields,
})

// ── แก้โปรไฟล์ (ผู้ใช้เดิมไม่บังคับกรอกครบ) ──

export const updateProfileSchema = z.object({
  name: nameSchema.optional().or(z.literal("")),
  nickname: z.string().max(20, "ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร").optional().or(z.literal("")),
  phone: thaiMobileSchema.optional().or(z.literal("")),
  residenceType: optionalText,
  residenceTypeOther: z.string().max(100).optional().or(z.literal("")),
  ...addressFields,
})

export type RegisterInput = z.infer<typeof registerSchema>
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
