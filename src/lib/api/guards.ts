import type { NextResponse } from "next/server"
import type { Session } from "next-auth"

import { auth } from "@/lib/auth"
import { forbidden, unauthorized } from "@/lib/api/response"

export type SessionUser = Session["user"]

type Guard =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse }

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
  if (session.user.role !== "admin") return { ok: false, response: forbidden() }

  return { ok: true, user: session.user }
}

/** ต้องเข้าสู่ระบบ (เป็น user หรือ admin ก็ได้) */
export async function requireUser(): Promise<Guard> {
  const session = await auth()

  if (!session?.user) return { ok: false, response: unauthorized() }

  return { ok: true, user: session.user }
}
