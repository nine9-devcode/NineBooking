import { OrderStatus } from "@prisma/client"

/**
 * กฎการเปลี่ยนสถานะคำสั่งจอง
 *
 * ก่อนหน้านี้ API เขียนค่าใหม่ทับลงไปตรงๆ โดยไม่ดูของเดิมเลย
 * จึงเปลี่ยนจาก CANCELLED กลับไป COMPLETED ได้ หรือจาก COMPLETED
 * ย้อนกลับไป PENDING ได้ ซึ่งไม่มีความหมายในโลกจริงและทำให้รายงานเพี้ยน
 *
 * COMPLETED กับ CANCELLED เป็นสถานะปลายทาง — ไปต่อไม่ได้แล้ว
 * ถ้าลูกค้าติดต่อกลับมาให้เปิดคำสั่งจองใบใหม่ ไม่ใช่ย้อนสถานะใบเก่า
 * เพราะการย้อนจะทำให้ประวัติในรายงานอ่านไม่รู้เรื่อง
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
}

/** สถานะที่จบแล้ว แก้อะไรไม่ได้อีก */
export const TERMINAL_STATUSES: readonly OrderStatus[] = ["COMPLETED", "CANCELLED"]

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true // เขียนค่าเดิมทับถือว่าไม่มีอะไรเปลี่ยน
  return ORDER_TRANSITIONS[from].includes(to)
}

/** สถานะถัดไปที่เลือกได้ ใช้ทำปุ่มในหน้า admin ให้ตรงกับกฎฝั่งเซิร์ฟเวอร์ */
export function nextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[from]
}

export class InvalidTransitionError extends Error {
  constructor(
    readonly from: OrderStatus,
    readonly to: OrderStatus
  ) {
    super(transitionMessage(from, to))
    this.name = "InvalidTransitionError"
  }
}

/** ข้อความอธิบายเหตุผล ใช้ทั้งใน error ของ API และ tooltip ของปุ่มที่ถูกปิด */
export function transitionMessage(from: OrderStatus, to: OrderStatus): string {
  if (isTerminal(from)) {
    const label = from === "COMPLETED" ? "เสร็จสิ้น" : "ยกเลิก"
    return `คำสั่งจองที่${label}แล้วเปลี่ยนสถานะไม่ได้ ถ้าต้องดำเนินการต่อให้เปิดใบใหม่`
  }

  return `เปลี่ยนจาก "${STATUS_LABELS[from]}" เป็น "${STATUS_LABELS[to]}" โดยตรงไม่ได้`
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "รอดำเนินการ",
  CONFIRMED: "ยืนยันแล้ว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to)
}
