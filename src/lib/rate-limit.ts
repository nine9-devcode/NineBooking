import { prisma } from "@/lib/db"

/**
 * ตัวจำกัดอัตราการเรียกแบบ fixed window เก็บสถานะไว้ในฐานข้อมูล
 *
 * ทำไมถึงเก็บใน DB ไม่ใช่ในหน่วยความจำ: Next รันหลาย worker และบน serverless
 * แต่ละ request อาจอยู่คนละ instance ตัวนับใน module scope จึงกันอะไรไม่ได้จริง
 * แลกกับการเขียน DB หนึ่งครั้งต่อการเรียกที่ถูกจำกัด ซึ่งคุ้มสำหรับ endpoint
 * ที่ยิงรัวแล้วเจ็บ (login, register, ส่งอีเมล, อัปโหลด)
 *
 * ถ้าจะขึ้น production ที่โหลดสูง ให้เปลี่ยนตัวหลังบ้านเป็น Redis
 * โดยคง signature ของ consume() ไว้ — จุดที่เรียกใช้ไม่ต้องแก้
 */

export interface RateLimitRule {
  /** จำนวนครั้งที่ยอมให้ทำได้ภายในหนึ่ง window */
  max: number
  windowMs: number
  /** ครบโควตาแล้วบล็อกนานเท่าไร — ไม่ใส่ = บล็อกจนหมด window */
  blockMs?: number
}

export interface RateLimitResult {
  ok: boolean
  retryAfterSec: number
}

export const RATE_LIMITS = {
  /** ต่อบัญชี — กันเดารหัสผ่านของคนใดคนหนึ่ง */
  loginPerEmail: { max: 5, windowMs: 15 * 60_000, blockMs: 15 * 60_000 },
  /** ต่อ IP — เพดานสูงกว่าเพราะออฟฟิศเดียวกันออก IP เดียว แต่ยังกันการไล่ยิงหลายบัญชี */
  loginPerIp: { max: 20, windowMs: 15 * 60_000, blockMs: 15 * 60_000 },
  register: { max: 5, windowMs: 60 * 60_000 },
  forgotPassword: { max: 5, windowMs: 60 * 60_000 },
  support: { max: 10, windowMs: 60 * 60_000 },
  upload: { max: 60, windowMs: 60 * 60_000 },
} as const satisfies Record<string, RateLimitRule>

const toSec = (ms: number) => Math.max(1, Math.ceil(ms / 1000))

/**
 * นับหนึ่งครั้งแล้วบอกว่าผ่านไหม
 *
 * เรียกก่อนทำงานจริงเสมอ และเรียกแม้ในเคสที่ input ผิดรูป
 * ไม่งั้นคนยิงจะเลี่ยงการนับได้ด้วยการส่งข้อมูลมั่วๆ
 */
export async function consume(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
  const now = new Date()

  const current = await prisma.rateLimit.findUnique({ where: { key } })

  if (current?.blockedUntil && current.blockedUntil > now) {
    return { ok: false, retryAfterSec: toSec(current.blockedUntil.getTime() - now.getTime()) }
  }

  // หลุด window เดิมแล้ว (หรือเพิ่งพ้นการบล็อก) → เริ่มนับใหม่
  const windowExpired =
    !current || now.getTime() - current.windowStart.getTime() >= rule.windowMs

  if (windowExpired) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStart: now, blockedUntil: null },
      update: { count: 1, windowStart: now, blockedUntil: null },
    })
    return { ok: true, retryAfterSec: 0 }
  }

  const next = await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  })

  if (next.count > rule.max) {
    const blockMs =
      rule.blockMs ?? rule.windowMs - (now.getTime() - next.windowStart.getTime())
    const blockedUntil = new Date(now.getTime() + Math.max(blockMs, 1000))

    await prisma.rateLimit.update({ where: { key }, data: { blockedUntil } })
    return { ok: false, retryAfterSec: toSec(blockedUntil.getTime() - now.getTime()) }
  }

  return { ok: true, retryAfterSec: 0 }
}

/** ล้างตัวนับหลังทำสำเร็จ เช่น ล็อกอินผ่านแล้วไม่ต้องจำว่าเคยพิมพ์ผิด */
export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } })
}

/**
 * IP ของผู้เรียก อ่านจาก header ที่ reverse proxy ใส่มา
 * ค่าเหล่านี้ปลอมได้ถ้าไม่มี proxy อยู่หน้า — บน Vercel/Nginx ที่เขียนทับให้จึงเชื่อได้
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown"

  return headers.get("x-real-ip")?.trim() || "unknown"
}

/**
 * ลบตัวนับที่หมดอายุแล้ว — เรียกจาก /api/cron
 * ถ้าไม่ลบ ตารางจะโตเรื่อยๆ เพราะทุกอีเมลที่พิมพ์ผิด (รวมที่ไม่มีในระบบ) สร้างแถวไว้
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60_000)

  const { count } = await prisma.rateLimit.deleteMany({
    where: {
      updatedAt: { lt: cutoff },
      OR: [{ blockedUntil: null }, { blockedUntil: { lt: new Date() } }],
    },
  })

  return count
}
