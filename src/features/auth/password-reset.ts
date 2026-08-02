import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

import { prisma } from "@/lib/db"

export const RESET_TOKEN_TTL_MINUTES = 30

/**
 * เก็บเฉพาะ hash ของ token ลงฐานข้อมูล ค่าดิบอยู่ในลิงก์ที่ส่งให้ผู้ใช้เท่านั้น
 * ถ้าฐานข้อมูลรั่ว คนที่ได้ไปก็ยังตั้งรหัสผ่านใหม่ไม่ได้
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export interface IssuedResetToken {
  token: string
  expiresAt: Date
}

export async function issueResetToken(userId: string): Promise<IssuedResetToken> {
  // ยกเลิกลิงก์เก่าที่ยังไม่ถูกใช้ — ให้มีลิงก์ที่ใช้ได้ทีละใบเท่านั้น
  await prisma.passwordResetToken.deleteMany({
    where: { userId, usedAt: null },
  })

  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  })

  return { token, expiresAt }
}

export type ResetTokenCheck =
  | { valid: true; userId: string; tokenId: string }
  | { valid: false; reason: "invalid" | "expired" | "used" }

export async function verifyResetToken(token: string): Promise<ResetTokenCheck> {
  const candidate = hashToken(token)

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: candidate },
    select: { id: true, userId: true, tokenHash: true, expiresAt: true, usedAt: true },
  })

  if (!record) return { valid: false, reason: "invalid" }

  // เทียบแบบเวลาคงที่ กัน timing attack แม้จะหาเจอด้วย index แล้วก็ตาม
  const matches = timingSafeEqual(
    Buffer.from(record.tokenHash, "hex"),
    Buffer.from(candidate, "hex")
  )
  if (!matches) return { valid: false, reason: "invalid" }

  if (record.usedAt) return { valid: false, reason: "used" }
  if (record.expiresAt < new Date()) return { valid: false, reason: "expired" }

  return { valid: true, userId: record.userId, tokenId: record.id }
}

export async function consumeResetToken(tokenId: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
  })
}

/** ลบ token ที่หมดอายุแล้ว เรียกจากงานตามเวลา */
export async function cleanupExpiredResetTokens(): Promise<number> {
  const result = await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  return result.count
}
