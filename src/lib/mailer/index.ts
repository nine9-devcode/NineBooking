import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

/**
 * โปรเจกนี้ไม่ผูกกับผู้ให้บริการอีเมลเจ้าไหน เพื่อให้โคลนมาแล้วรันได้ทันทีโดยไม่ต้องมี API key
 *
 * ตัว default (DevOutboxMailer) จะเขียนอีเมลเป็นไฟล์ .html ลง .dev-outbox/
 * แล้ว log path ออก console — เปิดดูในเบราว์เซอร์ได้เหมือนได้รับอีเมลจริง
 *
 * จะต่อของจริง (SMTP / Resend / SES) ก็เขียน object ที่ implement Mailer
 * แล้วเปลี่ยนค่า `mailer` ข้างล่างไฟล์นี้ — โค้ดส่วนอื่นไม่ต้องแก้เลย
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

      console.info(
        `[mailer] "${subject}" → ${recipients.join(", ")}\n` +
          `[mailer] เปิดดูได้ที่: ${filePath}`
      )

      return { success: true, reference: filePath }
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error"
      console.error("[mailer] เขียนไฟล์ไม่สำเร็จ:", message)
      return { success: false, error: message }
    }
  },
}

export const mailer: Mailer = devOutboxMailer

/**
 * ปลายทางของอีเมลแจ้งเตือนฝั่งผู้ดูแลระบบ
 * ตั้งได้ผ่าน ADMIN_EMAIL (คั่นด้วยจุลภาคได้หลายคน) ถ้าไม่ตั้งจะใช้ค่า dev
 */
export function getAdminRecipients(): string[] {
  const raw = process.env.ADMIN_EMAIL
  if (!raw) return ["admin@ninebooking.dev"]

  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
}
