import { z } from "zod"

/**
 * ตรวจ environment variable ตอน boot เพื่อให้พังเร็วพร้อมบอกว่าขาดตัวไหน
 * แทนที่จะไปพังกลางทางตอน query DB หรือตอน sign in
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "ต้องระบุ connection string ของ PostgreSQL"),

  NEXTAUTH_SECRET: z
    .string()
    .min(32, "ต้องยาวอย่างน้อย 32 ตัวอักษร — สร้างด้วย: openssl rand -base64 32"),
  NEXTAUTH_URL: z.url().default("http://localhost:3000"),

  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),

  // ใช้เป็น bearer token ป้องกัน endpoint งานตามเวลา (/api/cron/*)
  CRON_SECRET: z.string().min(16).optional(),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
})

function loadEnv() {
  const parsed = envSchema.safeParse(process.env)

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
