import { Prisma } from "@prisma/client"

import { requireSuperAdmin } from "@/lib/api/guards"
import { apiOk, handleApiError } from "@/lib/api/response"
import { prisma } from "@/lib/db"
import { env } from "@/lib/env"

/**
 * สถานะระบบสำหรับหน้าเครื่องมือระบบ — อ่านอย่างเดียว ไม่แก้อะไร
 *
 * ⚠️ ห้ามส่งค่าของ secret ออกไปเด็ดขาด บอกได้แค่ว่าตั้งไว้แล้วหรือยัง
 */

/** ตารางที่โตเรื่อยๆ ตามการใช้งาน — ตัวที่ต้องคอยดู */
const WATCHED_TABLES = [
  "ProductView",
  "ProductViewSummary",
  "AuditLog",
  "RateLimit",
  "PasswordResetToken",
  "OrderNotification",
  "IssueNotification",
  "UserOrderNotification",
  "UserSupportNotification",
] as const

export async function GET() {
  try {
    const guard = await requireSuperAdmin()
    if (!guard.ok) return guard.response

    // ใช้ n_live_tup จาก pg_stat_user_tables ไม่ใช่ COUNT(*)
    // เป็นค่าประมาณที่ Postgres เก็บไว้อยู่แล้ว จึงไม่ต้อง scan ทั้งตาราง
    // (COUNT(*) เป็น O(n) ซึ่งเป็นสิ่งที่หน้านี้มีไว้เตือนพอดี)
    const [tables, size, migration] = await Promise.all([
      prisma.$queryRaw<Array<{ table: string; rows: bigint }>>(Prisma.sql`
        SELECT relname AS "table", n_live_tup AS "rows"
        FROM pg_stat_user_tables
        WHERE relname IN (${Prisma.join(WATCHED_TABLES)})
        ORDER BY n_live_tup DESC
      `),
      prisma.$queryRaw<Array<{ bytes: bigint }>>(Prisma.sql`
        SELECT pg_database_size(current_database()) AS bytes
      `),
      prisma.$queryRaw<Array<{ name: string; finished: Date | null }>>(Prisma.sql`
        SELECT migration_name AS name, finished_at AS finished
        FROM _prisma_migrations
        ORDER BY finished_at DESC NULLS LAST
        LIMIT 1
      `),
    ])

    return apiOk({
      tables: tables.map((row) => ({ table: row.table, rows: Number(row.rows) })),
      databaseBytes: Number(size[0]?.bytes ?? 0),
      lastMigration: migration[0]
        ? { name: migration[0].name, finishedAt: migration[0].finished }
        : null,
      runtime: {
        node: process.version,
        nodeEnv: env.NODE_ENV,
        mailDriver: env.MAIL_DRIVER,
      },
      // บอกแค่ว่าตั้งหรือยัง ไม่ส่งค่าจริง
      secrets: {
        cronSecret: Boolean(env.CRON_SECRET),
        nextAuthSecret: Boolean(env.NEXTAUTH_SECRET),
        adminEmail: Boolean(env.ADMIN_EMAIL),
      },
    })
  } catch (error) {
    return handleApiError(error, "admin/dev/status")
  }
}
