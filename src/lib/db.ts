import { PrismaClient } from "@prisma/client"

// ตรวจ env ที่นี่เพราะทุกเส้นทางฝั่งเซิร์ฟเวอร์ผ่านโมดูลนี้
// ถ้าตั้งค่าไม่ครบจะได้พังตั้งแต่ตอนบูตพร้อมข้อความที่บอกว่าขาดอะไร
import { env } from "@/lib/env"

// เก็บ client ไว้บน globalThis ตอน dev เพื่อไม่ให้ hot reload สร้าง connection ใหม่ทุกครั้ง
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
