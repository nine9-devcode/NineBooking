import { 
  FileText, 
  FileSpreadsheet, 
  File as FileIcon,
  type LucideIcon 
} from "lucide-react"
import { DATASHEET_CONFIG, type AllowedFileExtension } from "@/features/products/datasheet.types"

/**
 * Format file size จาก bytes เป็น human-readable format
 * @example formatFileSize(2500000) // "2.4 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Get file extension from filename
 * @example getFileExtension("document.pdf") // "pdf"
 */
export function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ""
  return ext
}

/**
 * Get full file extension with dot
 * @example getFullExtension("document.pdf") // ".pdf"
 */
export function getFullExtension(filename: string): string {
  const ext = getFileExtension(filename)
  return ext ? `.${ext}` : ""
}

/**
 * Validate file type
 */
export function isValidFileType(file: File): boolean {
  const allowedTypes = Object.keys(DATASHEET_CONFIG.allowedFileTypes)
  return allowedTypes.includes(file.type)
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= DATASHEET_CONFIG.maxFileSize
}

/**
 * Get file validation error message
 */
export function getFileValidationError(file: File): string | null {
  if (!isValidFileType(file)) {
    return "ประเภทไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์ PDF, DOC, DOCX, XLS หรือ XLSX"
  }
  
  if (!isValidFileSize(file)) {
    return `ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${formatFileSize(DATASHEET_CONFIG.maxFileSize)})`
  }
  
  return null
}

/**
 * Get icon component based on file extension
 */
export function getFileIcon(extension: string): LucideIcon {
  const ext = extension.toLowerCase().replace('.', '')
  
  switch (ext) {
    case 'pdf':
      return FileText // PDF icon (สีแดง)
    case 'doc':
    case 'docx':
      return FileText // Word icon (สีน้ำเงิน)
    case 'xls':
    case 'xlsx':
      return FileSpreadsheet // Excel icon (สีเขียว)
    default:
      return FileIcon // Generic file icon
  }
}

/**
 * Get icon color class based on file extension
 */
export function getFileIconColor(extension: string): string {
  const ext = extension.toLowerCase().replace('.', '')
  
  switch (ext) {
    case 'pdf':
      return "text-destructive"
    case 'doc':
    case 'docx':
      return "text-info"
    case 'xls':
    case 'xlsx':
      return "text-success"
    default:
      return "text-muted-foreground"
  }
}

/**
 * Get human-readable file type name
 */
export function getFileTypeName(extension: string): string {
  const ext = extension.toLowerCase().replace('.', '')
  
  switch (ext) {
    case 'pdf':
      return 'PDF Document'
    case 'doc':
      return 'Word Document'
    case 'docx':
      return 'Word Document'
    case 'xls':
      return 'Excel Spreadsheet'
    case 'xlsx':
      return 'Excel Spreadsheet'
    default:
      return 'Document'
  }
}

/**
 * Get allowed file extensions as string for accept attribute
 * @example getAcceptString() // ".pdf,.doc,.docx,.xls,.xlsx"
 */
export function getAcceptString(): string {
  const extensions = Object.values(DATASHEET_CONFIG.allowedFileTypes).flat()
  return extensions.join(',')
}