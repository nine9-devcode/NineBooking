import * as z from "zod"

// Zod Schema สำหรับ Product Form
export const productSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อสินค้า").max(200, "ชื่อยาวเกินไป"),
  subtitle: z.string().max(300, "คำอธิบายย่อยยาวเกินไป"),
  slug: z
    .string()
    .min(1, "กรุณากรอก slug")
    .max(100, "slug ยาวเกินไป")
    .regex(/^[a-z0-9-]+$/, "slug ต้องเป็นตัวพิมพ์เล็ก ตัวเลข และ -"),
  description: z.string().min(1, "กรุณากรอกรายละเอียดสินค้า").max(50000, "รายละเอียดยาวเกินไป"),
  categoryId: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  isActive: z.boolean(),
})

export type ProductFormData = z.infer<typeof productSchema>

// Default values สำหรับ form
export const defaultFormValues: ProductFormData = {
  name: "",
  subtitle: "",
  slug: "",
  description: "",
  categoryId: "",
  isActive: true,
}
