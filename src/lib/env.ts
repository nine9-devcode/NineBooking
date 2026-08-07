import { z } from "zod"

/**
 * ตรวจ environment variable ตอน boot เพื่อให้พังเร็วพร้อมบอกว่าขาดตัวไหน
 * แทนที่จะไปพังกลางทางตอน query DB หรือตอน sign in
 *
 * ไฟล์นี้ถูก import จาก lib/db.ts ซึ่งเป็นทางผ่านของทุก request ฝั่งเซิร์ฟเวอร์
 * ถ้าไม่มีใคร import การตรวจนี้จะไม่เคยทำงานเลย
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "ต้องระบุ connection string ของ PostgreSQL"),

  NEXTAUTH_SECRET: z
    .string()
    .min(32, "ต้องยาวอย่างน้อย 32 ตัวอักษร — สร้างด้วย: openssl rand -base64 32"),
  NEXTAUTH_URL: z.url().default("http://localhost:3000"),

  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),

  // ใช้เป็น bearer token ป้องกัน endpoint งานตามเวลา (/api/cron)
  CRON_SECRET: z.string().min(16).optional(),

  /**
   * ช่องทางส่งอีเมล — ค่าเริ่มต้นเขียนลงไฟล์ใน .dev-outbox/ ให้เปิดดูได้ตอนพัฒนา
   * ห้ามใช้ค่านี้บน production เพราะลิงก์ตั้งรหัสผ่านใหม่จะไปกองอยู่บนดิสก์
   */
  MAIL_DRIVER: z.enum(["outbox", "console"]).default("outbox"),
  ADMIN_EMAIL: z.string().optional(),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
})

function loadEnv() {
  // อ่านทีละตัวแบบตรงๆ ไม่ส่ง process.env ทั้งก้อน
  // เพราะบน Edge runtime ตัวแปรจะถูก inline เฉพาะที่ถูกอ้างถึงตรงๆ เท่านั้น
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    MAIL_DRIVER: process.env.MAIL_DRIVER,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    NODE_ENV: process.env.NODE_ENV,
  })

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n")

    throw new Error(
      `\n\nตั้งค่า environment ไม่ครบ:\n${issues}\n\n` +
        `คัดลอก .env.example ไปเป็น .env แล้วกรอกค่าให้ครบก่อนรันครับ\n`
    )
  }

  return parsed.data
}

export const env = loadEnv()
export type Env = typeof env
