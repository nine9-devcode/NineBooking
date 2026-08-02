/**
 * สีสำหรับเอกสาร PDF และ Excel
 *
 * ไฟล์เหล่านั้นเรนเดอร์นอกเบราว์เซอร์ จึงใช้ CSS variable ไม่ได้
 * ต้องเป็นค่าสีตายตัว — เก็บไว้ที่เดียวจะได้ปรับให้เข้ากับธีมเว็บได้ง่าย
 *
 * เอกสารพิมพ์ลงกระดาษ จึงใช้พื้นขาวเสมอ ไม่ตามธีมเข้มของหน้าเว็บ
 */
export const pdfTheme = {
  /** น้ำเงินหลัก ใช้กับหัวเรื่องและเส้นคั่น */
  primary: "#4b7bec",
  primarySoft: "#eaf0fe",

  text: "#111827",
  textMuted: "#6b7280",
  textFaint: "#9ca3af",

  border: "#d1d5db",
  borderLight: "#e5e7eb",
  surface: "#ffffff",
  surfaceAlt: "#f9fafb",
} as const

/** ExcelJS ต้องการรูปแบบ ARGB (ไม่มี #) */
export const excelTheme = {
  primary: "FF4B7BEC",
  primaryDark: "FF2D4EA8",
  headerText: "FFFFFFFF",
  rowAlt: "FFF4F6FB",
  border: "FFD1D5DB",
} as const
