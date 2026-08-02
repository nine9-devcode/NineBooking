/**
 * ข้อมูลบริษัทที่พิมพ์ลงหัวเอกสาร PDF (ใบเสนอราคา / ใบจอง)
 *
 * ค่าจริงเก็บในตาราง QuotationSettings แก้ได้จากหน้า admin → ตั้งค่า
 * ค่าตรงนี้เป็นค่าตั้งต้นที่ใช้ตอนยังไม่เคยตั้งค่าในระบบ (ข้อมูลสมมติทั้งหมด)
 */
export const companyDefaults = {
  nameTh: "บริษัท ไนน์บุ๊คกิ้ง จำกัด (สำนักงานใหญ่)",
  nameEn: "NINEBOOKING CO., LTD.",
  address: "99/9 ถนนตัวอย่าง แขวงตัวอย่าง เขตตัวอย่าง กรุงเทพฯ 10000",
  taxId: "0000000000000",
  phone: "02-000-0000",
  website: "ninebooking.example",
} as const

/**
 * โลโก้ที่ใช้ในหัว PDF — วางไฟล์ PNG เองได้ที่ path นี้
 * ถ้าไม่มีไฟล์ ระบบจะพิมพ์ชื่อบริษัทเป็นข้อความแทน
 */
export const PDF_LOGO_RELATIVE_PATH = ["public", "brand", "quotation-logo.png"] as const
