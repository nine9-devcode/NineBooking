// components/admin/quotations/schema.ts

import { z } from "zod"

// Schema สำหรับ Quotation Item
export const quotationItemSchema = z.object({
  tempId: z.string(),
  productId: z.string().nullable(),
  productName: z.string().min(1, "กรุณาระบุชื่อสินค้า"),
  productImage: z.string().nullable(),
  isPairedProduct: z.boolean().default(false),
  pairedWithTempId: z.string().nullable(),
  quantity: z.number().int().min(1, "จำนวนต้องมากกว่า 0"),
  unitPrice: z.number().min(0, "ราคาต้องไม่ติดลบ"),
})

// Schema สำหรับ Create Quotation
export const createQuotationSchema = z.object({
  orderId: z.string().min(1, "กรุณาระบุ Order ID"),
  items: z.array(quotationItemSchema).min(1, "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ"),
  includeVat: z.boolean().default(true),
  vatPercent: z.number().min(0).max(100).default(7),
  validDays: z.number().int().min(1).max(365).default(15),
  notes: z.string().optional().default(""),
  pdfNotes: z.string().nullable().optional().default(null),
})

// Schema สำหรับ Update Quotation
export const updateQuotationSchema = z.object({
  items: z.array(quotationItemSchema).min(1).optional(),
  includeVat: z.boolean().optional(),
  vatPercent: z.number().min(0).max(100).optional(),
  validDays: z.number().int().min(1).max(365).optional(),
  notes: z.string().optional(),
  pdfNotes: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]).optional(),
})

// Schema สำหรับ Update Status เท่านั้น
export const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]),
})

// Types
export type QuotationItemInput = z.infer<typeof quotationItemSchema>
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>
