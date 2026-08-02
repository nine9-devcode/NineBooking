// Types for Datasheet Items (รองรับทั้ง URL และ File Upload)

export type DatasheetType = "url" | "file"

export interface DatasheetItem {
  id: string // Unique ID สำหรับ React key
  name: string // ชื่อที่แสดงในปุ่มดาวน์โหลด
  type: DatasheetType // ประเภท: URL หรือ File
  value: string // ลิงก์ภายนอก หรือ path ของไฟล์ที่อัปโหลด (/uploads/...)
  
  // Fields สำหรับ File เท่านั้น
  fileType?: string // "pdf" | "doc" | "docx" | "xls" | "xlsx"
  fileSize?: number // ขนาดไฟล์ (bytes)
  fileName?: string // ชื่อไฟล์ต้นฉบับ
  
  // Upload state (ใช้ใน UI เท่านั้น ไม่บันทึกลง DB)
  file?: File // File object (สำหรับอัปโหลด)
  uploading?: boolean // กำลังอัปโหลดอยู่
  uploadProgress?: number // Progress (0-100)
}

// JSON structure ที่บันทึกลง Database
export interface DatasheetJSON {
  type: DatasheetType
  name: string
  value: string
  fileType?: string
  fileSize?: number
  fileName?: string
}

// Validation Config
export const DATASHEET_CONFIG = {
  maxItems: 5,
  maxFileSize: 15 * 1024 * 1024, // 15 MB
  allowedFileTypes: {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  } as Record<string, string[]>,
} as const

// Helper type for allowed file extensions
export type AllowedFileExtension = '.pdf' | '.doc' | '.docx' | '.xls' | '.xlsx'