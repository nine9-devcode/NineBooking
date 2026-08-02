import { PrismaClient } from "@prisma/client"

// เก็บ client ไว้บน globalThis ตอน dev เพื่อไม่ให้ hot reload สร้าง connection ใหม่ทุกครั้ง
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
