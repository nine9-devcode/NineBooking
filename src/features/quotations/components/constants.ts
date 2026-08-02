// components/admin/quotations/constants.ts

import { 
  FileEdit, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock,
  LucideIcon 
} from "lucide-react"
import { StatusConfig } from "./types"

// Status Configuration
export const QUOTATION_STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: {
    label: "ร่าง",
    color: "bg-muted text-foreground border-border",
    darkColor: "bg-secondary/20 text-muted-foreground border-border",
    icon: FileEdit,
  },
  SENT: {
    label: "ยืนยัน",
    color: "bg-info/10 text-info border-info/40",
    darkColor: "bg-info/20 text-info border-info/30",
    icon: Send,
  },
  ACCEPTED: {
    label: "เสร็จสิ้น",
    color: "bg-success/10 text-success border-success/40",
    darkColor: "bg-success/20 text-success border-success/30",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "ปฏิเสธ",
    color: "bg-destructive/10 text-destructive border-destructive/40",
    darkColor: "bg-destructive/20 text-destructive border-destructive/30",
    icon: XCircle,
  },
  EXPIRED: {
    label: "หมดอายุ",
    color: "bg-warning/10 text-warning border-warning/40",
    darkColor: "bg-warning/20 text-warning border-warning/30",
    icon: Clock,
  },
}

// Status Options สำหรับ Select
export const QUOTATION_STATUS_OPTIONS = [
  { value: "DRAFT", label: "ร่าง" },
  { value: "SENT", label: "ยืนยัน" },
  { value: "ACCEPTED", label: "เสร็จสิ้น" },
  { value: "REJECTED", label: "ปฏิเสธ" },
  { value: "EXPIRED", label: "หมดอายุ" },
]

// Helper function
export function getQuotationStatusConfig(status: string): StatusConfig {
  return QUOTATION_STATUS_CONFIG[status] || QUOTATION_STATUS_CONFIG.DRAFT
}

// Default PDF Notes (template shown when pdfNotes === null)
export const DEFAULT_PDF_NOTES = `เมื่อลูกค้าต้องการซื้อสินค้า/บริการ 
กรุณาชำระค่ามัดจำค่าสินค้า ล็อคคิวติดตั้ง 
เป็นจำนวนเงิน 50% ของยอดทั้งหมด 
งานติดตั้ง/ส่งสินค้า เรียบร้อยแล้ว กรุณาชำระยอดเงินที่เหลือทั้งหมด 
สินค้ารับประกัน 2 ปี (ใช้งานปกติ เสียบปลั๊กตัวใหม่ ใช้งานต่อทันที) 
* งานติดตั้งรวมค่าบริการ Service On site เป็นระยะเวลา 1 ปี นับจากวันที่ติดตั้งกับทางบริษัทฯ`

// Valid Days Options
export const VALID_DAYS_OPTIONS = [
  { value: 7, label: "7 วัน" },
  { value: 15, label: "15 วัน" },
  { value: 30, label: "30 วัน" },
  { value: 45, label: "45 วัน" },
  { value: 60, label: "60 วัน" },
  { value: 90, label: "90 วัน" },
]

// Format helpers
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date, includeTime = false): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }

  if (includeTime) {
    options.hour = "2-digit"
    options.minute = "2-digit"
  }

  return new Date(date).toLocaleDateString("th-TH", options)
}

export function formatThaiDate(date: Date | string): string {
  const d = new Date(date)
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]
  const day = d.getDate()
  const month = thaiMonths[d.getMonth()]
  const year = d.getFullYear() + 543
  return `${day} ${month} ${year}`
}

// Number to Thai Text
export function numberToThaiText(num: number): string {
  if (num === 0) return "ศูนย์บาทถ้วน"
  
  const digits = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"]
  const positions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"]
  
  const baht = Math.floor(num)
  const satang = Math.round((num - baht) * 100)
  
  let result = ""
  
  if (baht > 0) {
    let remaining = baht
    let position = 0
    
    while (remaining > 0) {
      const digit = remaining % 10
      remaining = Math.floor(remaining / 10)
      
      if (digit > 0) {
        let digitText = digits[digit]
        if (position === 1 && digit === 2) digitText = "ยี่"
        if (position === 1 && digit === 1) digitText = ""
        if (position === 0 && digit === 1 && baht > 10) digitText = "เอ็ด"
        result = digitText + positions[position] + result
      }
      
      position++
      if (position === 7) {
        result = "ล้าน" + result
        position = 1
      }
    }
    
    result += "บาท"
  }
  
  if (satang > 0) {
    const satangTens = Math.floor(satang / 10)
    const satangUnits = satang % 10
    
    if (satangTens > 0) {
      if (satangTens === 2) result += "ยี่สิบ"
      else if (satangTens === 1) result += "สิบ"
      else result += digits[satangTens] + "สิบ"
    }
    
    if (satangUnits > 0) {
      if (satangUnits === 1 && satangTens > 0) result += "เอ็ด"
      else result += digits[satangUnits]
    }
    
    result += "สตางค์"
  } else if (baht > 0) {
    result += "ถ้วน"
  }
  
  return result
}