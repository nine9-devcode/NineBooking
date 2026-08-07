import { Decimal } from "@prisma/client/runtime/library"

/**
 * คำนวณยอดของใบเสนอราคาด้วย Decimal ตลอดสาย
 *
 * ของเดิมคูณ/หารด้วย number ธรรมดา (`subtotal * (vatPercent / 100)`)
 * แล้วค่อยห่อด้วย Decimal ตอนบันทึก ซึ่งช้าไปแล้ว — ความคลาดเคลื่อนของ
 * เลขทศนิยมฐานสองถูกอบเข้าไปในค่าตั้งแต่ก่อนถึง Postgres
 * เอกสารที่เป็นราคาไม่ควรมีเศษที่อธิบายไม่ได้แม้แต่สตางค์เดียว
 */

export interface QuotationLineInput {
  quantity: number
  unitPrice: number | Decimal
}

export interface QuotationTotals {
  subtotal: Decimal
  vatAmount: Decimal
  totalAmount: Decimal
}

/** ยอดของแต่ละบรรทัด = จำนวน × ราคาต่อหน่วย */
export function lineAmount(item: QuotationLineInput): Decimal {
  return new Decimal(item.unitPrice).times(item.quantity).toDecimalPlaces(2)
}

export function calculateQuotationTotals(
  items: QuotationLineInput[],
  { includeVat, vatPercent }: { includeVat: boolean; vatPercent: number | Decimal }
): QuotationTotals {
  const subtotal = items
    .reduce((sum, item) => sum.plus(lineAmount(item)), new Decimal(0))
    .toDecimalPlaces(2)

  const vatAmount = includeVat
    ? subtotal.times(vatPercent).dividedBy(100).toDecimalPlaces(2)
    : new Decimal(0)

  return { subtotal, vatAmount, totalAmount: subtotal.plus(vatAmount).toDecimalPlaces(2) }
}
