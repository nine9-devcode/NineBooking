// ===== Residence Types =====
// ประเภทที่อยู่อาศัย สำหรับ Phase 6.1: Registration Improvements

export const RESIDENCE_TYPES = [
  { value: "single_house", label: "บ้านเดี่ยว" },
  { value: "condo", label: "คอนโด" },
  { value: "townhouse", label: "ทาวน์เฮาส์" },
  { value: "apartment", label: "อพาร์ทเมนต์" },
  { value: "other", label: "อื่นๆ" },
] as const

export type ResidenceTypeValue = typeof RESIDENCE_TYPES[number]["value"]

// ฟังก์ชันสำหรับหา label จาก value
export function getResidenceTypeLabel(value: string): string {
  const found = RESIDENCE_TYPES.find(type => type.value === value)
  if (found) {
    return found.label
  }
  // ถ้าไม่ใช่ค่า predefined แสดงว่าเป็นค่าที่กรอกเอง (อื่นๆ)
  return value
}

// ฟังก์ชันตรวจสอบว่าเป็นค่า predefined หรือไม่
export function isPredefinedResidenceType(value: string): boolean {
  return RESIDENCE_TYPES.some(type => type.value === value)
}
// ประเภทสมาชิก
export const MEMBER_TYPES = {
  CUSTOMER: 'customer',
  CONTRACTOR: 'contractor',
  DEALER: 'dealer',
  office: 'office',
  OTHER: 'other',
} as const

export type MemberType = typeof MEMBER_TYPES[keyof typeof MEMBER_TYPES]

// Label แสดงผล
export const MEMBER_TYPE_LABELS: Record<string, string> = {
  customer: 'ลูกค้าทั่วไป',
  contractor: 'ผู้รับเหมา',
  dealer: 'ตัวแทนจำหน่าย',
  other: 'อื่นๆ',
}

// ฟังก์ชันแปลง memberType เป็น label
export function getMemberTypeLabel(memberType: string | null): string {
  if (!memberType) return 'ไม่ระบุ'
  return MEMBER_TYPE_LABELS[memberType] || memberType
}

// สีสำหรับแสดงผล badge
export const MEMBER_TYPE_COLORS: Record<string, string> = {
  customer: 'blue',
  contractor: 'orange',
  dealer: 'purple',
  other: 'gray',
}