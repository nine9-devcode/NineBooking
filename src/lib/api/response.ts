import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { UploadError } from "@/lib/storage"

/** ตอบสำเร็จ */
export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

/** ตอบผิดพลาดด้วยรูปแบบเดียวกันทั้งระบบ: { error: string } */
export function apiError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

export const unauthorized = () => apiError("กรุณาเข้าสู่ระบบ", 401)
export const forbidden = () => apiError("ไม่มีสิทธิ์เข้าถึง", 403)
export const notFound = (what = "ข้อมูล") => apiError(`ไม่พบ${what}`, 404)

/** ถูกจำกัดอัตรา — ส่ง Retry-After ให้ client รู้ว่าควรรอนานเท่าไร */
export function tooManyRequests(retryAfterSec: number) {
  const minutes = Math.ceil(retryAfterSec / 60)

  return NextResponse.json(
    { error: `มีการเรียกใช้งานถี่เกินไป กรุณาลองใหม่ในอีก ${minutes} นาที` },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  )
}

/**
 * ตัวห่อ catch ท้าย route — แปลง ZodError เป็น 400 พร้อมรายละเอียดฟิลด์
 * ที่เหลือ log ไว้แล้วตอบ 500 กลางๆ ไม่หลุด stack trace ออกไปหา client
 */
export function handleApiError(error: unknown, context: string) {
  // ไฟล์ไม่ผ่านเกณฑ์เป็นความผิดของ request ไม่ใช่ของระบบ และข้อความเขียนไว้ให้ผู้ใช้อ่านอยู่แล้ว
  if (error instanceof UploadError) {
    return apiError(error.message, 400)
  }

  if (error instanceof ZodError) {
    return apiError("ข้อมูลไม่ถูกต้อง", 400, {
      fields: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    })
  }

  console.error(`[api:${context}]`, error)
  return apiError("เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", 500)
}
