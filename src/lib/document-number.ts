import type { Prisma } from "@prisma/client"

/**
 * ออกเลขที่เอกสารแบบไม่ชนกัน
 *
 * โค้ดเดิมของทั้งสามระบบ (order / issue / quotation) นับด้วย count()+1
 * หรือ "หาเลขล่าสุดแล้ว +1" นอกทรานแซกชัน ซึ่งมีช่องว่างระหว่างอ่านกับเขียน
 * สองคนกด checkout พร้อมกันจึงได้เลขเดียวกัน คนที่เขียนทีหลังไปชน
 * unique constraint แล้วทั้งคำสั่งพัง — ที่แย่กว่านั้นคือตะกร้าไม่ถูกล้าง
 * ลูกค้าเลยไม่รู้ว่าสั่งติดหรือไม่ติด
 *
 * upsert ที่ increment เป็น atomic ระดับ row ของ Postgres
 * และเมื่อเรียกด้วย tx ตัวเดียวกับที่สร้างเอกสาร เลขกับเอกสารจะ commit พร้อมกัน
 * ถ้าทรานแซกชัน rollback เลขก็คืนกลับไปด้วย
 */

export type DocumentScope = "ORDER" | "ISSUE" | "QUOTATION"

/**
 * คีย์ของวันตามเวลาท้องถิ่น (เช่น "20260807")
 *
 * เดิมโค้ดสร้าง prefix จาก toISOString() ซึ่งเป็น UTC แต่ไปนับจำนวนด้วยช่วง
 * ที่สร้างจาก setHours() ซึ่งเป็นเวลาท้องถิ่น พอเป็นเวลาไทย (UTC+7)
 * ช่วงก่อนเที่ยงคืนถึง 07:00 น. สองอย่างนี้จะคนละวันกัน เลขลำดับเลยรีเซ็ตกลางวัน
 */
export function localDayKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}${month}${day}`
}

export function localYearKey(date = new Date()): string {
  return String(date.getFullYear())
}

/** ต้องรับ tx ไม่ใช่ prisma ตัวเต็ม เพื่อบังคับให้ขอเลขในทรานแซกชันเดียวกับที่บันทึกเอกสาร */
export async function nextSequence(
  tx: Prisma.TransactionClient,
  scope: DocumentScope,
  period: string
): Promise<number> {
  const counter = await tx.documentCounter.upsert({
    where: { scope_period: { scope, period } },
    create: { scope, period, value: 1 },
    update: { value: { increment: 1 } },
  })

  return counter.value
}

/** ORD-20260807-001 */
export async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const period = localDayKey()
  const sequence = await nextSequence(tx, "ORDER", period)

  return `ORD-${period}-${String(sequence).padStart(3, "0")}`
}

/** ISS-2026-0001 */
export async function nextIssueNumber(tx: Prisma.TransactionClient): Promise<string> {
  const period = localYearKey()
  const sequence = await nextSequence(tx, "ISSUE", period)

  return `ISS-${period}-${String(sequence).padStart(4, "0")}`
}

/** QT-2026-0001 — เลขฐานของใบเสนอราคา ส่วน version ต่อท้ายจัดการแยกในฟีเจอร์นั้น */
export async function nextQuotationBaseNumber(
  tx: Prisma.TransactionClient
): Promise<string> {
  const period = localYearKey()
  const sequence = await nextSequence(tx, "QUOTATION", period)

  return `QT-${period}-${String(sequence).padStart(4, "0")}`
}
