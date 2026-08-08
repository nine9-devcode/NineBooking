import type { NextResponse } from "next/server"
import type { Session } from "next-auth"

import { auth } from "@/lib/auth"
import { forbidden, unauthorized } from "@/lib/api/response"
import { isAdminRole, isSuperAdminRole } from "@/lib/roles"

export type SessionUser = Session["user"]

type Guard = { ok: true; user: SessionUser } | { ok: false; response: NextResponse }

/**
 * ใช้แทนการเช็ค session ซ้ำๆ ในทุก route
 *
 *   const guard = await requireAdmin()
 *   if (!guard.ok) return guard.response
 *   // ตรงนี้ guard.user มี type ครบแล้ว
 */
export async function requireAdmin(): Promise<Guard> {
  const session = await auth()

  if (!session?.user) return { ok: false, response: unauthorized() }
  if (!isAdminRole(session.user.role)) return { ok: false, response: forbidden() }

  return { ok: true, user: session.user }
}

/** ต้องเข้าสู่ระบบ (เป็น user หรือ admin ก็ได้) */
export async function requireUser(): Promise<Guard> {
  const session = await auth()

  if (!session?.user) return { ok: false, response: unauthorized() }

  return { ok: true, user: session.user }
}

/**
 * เครื่องมือระบบที่ลบข้อมูลได้ — เฉพาะ superadmin
 *
 * แยกจาก requireAdmin เพราะแอดมินทั่วไปไม่ควรมีปุ่มล้างข้อมูลอยู่ในมือ
 */
export async function requireSuperAdmin(): Promise<Guard> {
  const session = await auth()

  if (!session?.user) return { ok: false, response: unauthorized() }
  if (!isSuperAdminRole(session.user.role)) return { ok: false, response: forbidden() }

  return { ok: true, user: session.user }
}
