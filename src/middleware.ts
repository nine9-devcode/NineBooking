import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

// middleware ทำงานบน Edge runtime จึงเรียก Prisma ตรงๆ ไม่ได้
// ต้องถาม API แทน — แคชผลไว้ 30 วินาทีต่อ worker เพื่อไม่ให้ยิงทุก request
const SETTINGS_TTL_MS = 30_000
let cachedShowHomePage = true
let cachedAt = 0

/**
 * ต้องยึด origin จาก env ไม่ใช่จาก req.url
 *
 * req.url ประกอบขึ้นจาก Host header ซึ่งผู้เรียกตั้งเองได้ และโปรเจกนี้ตั้ง
 * trustHost: true ไว้ ผลคือถ้าใช้ req.url ตรงๆ คนยิงสามารถปลอม Host
 * ให้ middleware ไปถามเซิร์ฟเวอร์ของตัวเอง แล้วสั่งเปิด/ปิดเว็บได้
 */
const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

async function isSiteOpen(): Promise<boolean> {
  if (Date.now() - cachedAt < SETTINGS_TTL_MS) return cachedShowHomePage

  try {
    const res = await fetch(new URL("/api/settings/home-page", APP_ORIGIN))
    if (res.ok) {
      const data = (await res.json()) as { showHomePage?: boolean }
      cachedShowHomePage = data.showHomePage !== false
      cachedAt = Date.now()
    }
  } catch (error) {
    // ล้มเหลวแล้วเปิดเว็บไว้ก่อน ดีกว่าปิดทั้งเว็บเพราะ API ล่ม
    console.error("[middleware] อ่านสถานะเว็บไม่สำเร็จ:", error)
  }

  return cachedShowHomePage
}

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/error",
]
const LEGAL_PATHS = ["/privacy-policy", "/terms"]

export default auth(async (req) => {
  const isLoggedIn = Boolean(req.auth)
  const { pathname } = req.nextUrl
  const userRole = req.auth?.user?.role ?? null

  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isLegalPage = LEGAL_PATHS.some((p) => pathname.startsWith(p))
  const isAdminZone = pathname.startsWith("/admin")
  const isAdminLoginPage = pathname === "/admin/login"
  const isMaintenancePage = pathname === "/maintenance"
  const isUserZone = !isAdminZone && !isPublicPage && !isLegalPage && !isMaintenancePage

  // หน้าเอกสารทางกฎหมาย เข้าได้เสมอ
  if (isLegalPage) return NextResponse.next()

  // ── ปิดเว็บชั่วคราว ──
  const siteOpen = await isSiteOpen()

  if (!siteOpen) {
    // admin และโซน admin ผ่านได้ (CASE ถัดไปจะพาไป /admin/login เองถ้ายังไม่ล็อกอิน)
    const canBypass = userRole === "admin" || isAdminZone
    if (!canBypass) {
      if (isPublicPage || isMaintenancePage) return NextResponse.next()
      return NextResponse.redirect(new URL("/maintenance", req.url))
    }
  } else if (isMaintenancePage) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // ── ยังไม่ล็อกอิน ──
  if (!isLoggedIn) {
    if (isAdminLoginPage || isPublicPage) return NextResponse.next()
    if (isAdminZone) return NextResponse.redirect(new URL("/admin/login", req.url))
    if (isUserZone) return NextResponse.redirect(new URL("/login", req.url))
    return NextResponse.next()
  }

  // ── ล็อกอินแล้ว: ผู้ดูแลระบบ ──
  if (userRole === "admin") {
    if (isAdminLoginPage) return NextResponse.redirect(new URL("/admin", req.url))
    if (isAdminZone) return NextResponse.next()
    // admin หลงเข้าฝั่งผู้ใช้ → พากลับ dashboard
    return NextResponse.redirect(new URL("/admin", req.url))
  }

  // ── ล็อกอินแล้ว: ผู้ใช้ทั่วไป ──
  if (isAdminZone) return NextResponse.redirect(new URL("/", req.url))
  if (isPublicPage) return NextResponse.redirect(new URL("/", req.url))

  // โปรไฟล์ยังไม่ครบ → บังคับให้กรอกก่อนใช้งาน
  const user = req.auth?.user
  const profileIncomplete =
    !user?.nickname || !user?.phone || !user?.residenceType

  if (
    profileIncomplete &&
    pathname !== "/complete-profile" &&
    pathname !== "/api/auth/signout"
  ) {
    return NextResponse.redirect(new URL("/complete-profile", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // ข้าม API, ไฟล์ static และไฟล์ที่มีนามสกุล
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|brand|fonts|.*\\.[a-zA-Z0-9]+$).*)",
  ],
}
