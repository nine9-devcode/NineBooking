import { NextResponse } from "next/server"
import { ZodError } from "zod"

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

/**
 * ตัวห่อ catch ท้าย route — แปลง ZodError เป็น 400 พร้อมรายละเอียดฟิลด์
 * ที่เหลือ log ไว้แล้วตอบ 500 กลางๆ ไม่หลุด stack trace ออกไปหา client
 */
export function handleApiError(error: unknown, context: string) {
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
