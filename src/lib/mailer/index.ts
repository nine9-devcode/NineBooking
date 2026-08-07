import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { env } from "@/lib/env"

/**
 * โปรเจกนี้ไม่ผูกกับผู้ให้บริการอีเมลเจ้าไหน เพื่อให้โคลนมาแล้วรันได้ทันทีโดยไม่ต้องมี API key
 *
 * ตัว default (outbox) จะเขียนอีเมลเป็นไฟล์ .html ลง .dev-outbox/
 * เปิดดูในเบราว์เซอร์ได้เหมือนได้รับอีเมลจริง
 *
 * ⚠️ โหมด outbox ห้ามใช้บน production — ลิงก์ตั้งรหัสผ่านใหม่จะไปกองอยู่บนดิสก์
 * ใครอ่านโฟลเดอร์นั้นได้ก็ยึดบัญชีใครก็ได้ทันที lib/env.ts จึงโยน error
 * ถ้า NODE_ENV เป็น production แล้ว MAIL_DRIVER ยังเป็น outbox อยู่
 *
 * จะต่อของจริง (SMTP / Resend / SES) ให้เขียน object ที่ implement Mailer
 * แล้วเพิ่มเข้า DRIVERS ข้างล่าง — โค้ดส่วนอื่นไม่ต้องแก้เลย
 */

export interface MailMessage {
  to: string | string[]
  subject: string
  html: string
}

export interface MailResult {
  success: boolean
  /** path ของไฟล์ที่เขียน (โหมด dev) หรือ id จากผู้ให้บริการ */
  reference?: string
  error?: string
}

export interface Mailer {
  send(message: MailMessage): Promise<MailResult>
}

const OUTBOX_DIR = path.join(process.cwd(), ".dev-outbox")

function timestampSlug(subject: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const slug =
    subject
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 50) || "mail"

  return `${stamp}__${slug}.html`
}

export const devOutboxMailer: Mailer = {
  async send({ to, subject, html }) {
    const recipients = Array.isArray(to) ? to : [to]

    try {
      await mkdir(OUTBOX_DIR, { recursive: true })

      const fileName = timestampSlug(subject)
      const filePath = path.join(OUTBOX_DIR, fileName)

      // แปะหัวบอกผู้รับไว้ในไฟล์ด้วย จะได้รู้ว่าฉบับนี้ส่งหาใคร
      const banner =
        `<!-- NineBooking dev outbox -->\n` +
        `<div style="font:14px/1.6 system-ui;background:#161d33;color:#e6ebff;padding:12px 16px;margin-bottom:16px;border-radius:8px">` +
        `<strong>To:</strong> ${recipients.join(", ")}<br>` +
        `<strong>Subject:</strong> ${subject}` +
        `</div>\n`

      await writeFile(filePath, banner + html, "utf8")

      console.info(`[mailer] "${subject}" → เปิดดูได้ที่ ${filePath}`)

      return { success: true, reference: filePath }
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error"
      console.error("[mailer] เขียนไฟล์ไม่สำเร็จ:", message)
      return { success: false, error: message }
    }
  },
}

/** สำหรับตอนรันใน container ที่ไม่มีดิสก์ให้เขียน — ดูเนื้ออีเมลจาก log แทน */
export const consoleMailer: Mailer = {
  async send({ to, subject, html }) {
    const recipients = Array.isArray(to) ? to : [to]

    console.info(
      `\n──── mail ────\nTo: ${recipients.join(", ")}\nSubject: ${subject}\n\n${html}\n──────────────\n`
    )

    return { success: true, reference: "console" }
  },
}

const DRIVERS: Record<typeof env.MAIL_DRIVER, Mailer> = {
  outbox: devOutboxMailer,
  console: consoleMailer,
}

function resolveDriver(): Mailer {
  if (env.NODE_ENV === "production" && env.MAIL_DRIVER === "outbox") {
    throw new Error(
      "MAIL_DRIVER ยังเป็น outbox บน production — โหมดนี้เขียนอีเมล " +
        "(รวมลิงก์ตั้งรหัสผ่านใหม่) ลงไฟล์ในเครื่องแทนการส่งจริง " +
        "เขียน adapter ตัวใหม่ใน src/lib/mailer/ แล้วตั้ง MAIL_DRIVER ให้ตรงก่อนครับ"
    )
  }

  return DRIVERS[env.MAIL_DRIVER]
}

/**
 * เลือก driver ตอนส่งจริง ไม่ใช่ตอน import
 *
 * next build ตั้ง NODE_ENV=production แล้วไล่โหลดทุกโมดูลเพื่อเก็บข้อมูลหน้า
 * ถ้าเช็คตอน import ตัว build จะพังทั้งที่ยังไม่มีการส่งอีเมลสักฉบับ
 */
export const mailer: Mailer = {
  send: (message) => resolveDriver().send(message),
}

/**
 * ปลายทางของอีเมลแจ้งเตือนฝั่งผู้ดูแลระบบ
 * ตั้งได้ผ่าน ADMIN_EMAIL (คั่นด้วยจุลภาคได้หลายคน) ถ้าไม่ตั้งจะใช้ค่า dev
 */
export function getAdminRecipients(): string[] {
  if (!env.ADMIN_EMAIL) return ["admin@ninebooking.dev"]

  return env.ADMIN_EMAIL.split(",")
    .map((email) => email.trim())
    .filter(Boolean)
}

/** กัน HTML injection ตอนเอาค่าจากผู้ใช้ (ชื่อ/ชื่อเล่น) ไปแปะในเนื้ออีเมล */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
