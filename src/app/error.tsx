"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * ตัวรับ error ของทั้งเว็บ
 *
 * โปรเจกนี้ไม่มีไฟล์นี้มาก่อนเลย และหน้าส่วนใหญ่เป็น client component
 * error ตอน render จึงกลายเป็นจอขาวบน production โดยที่ผู้ใช้ไม่รู้ว่าเกิดอะไรขึ้น
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // ที่นี่คือจุดที่ควรต่อ Sentry หรือบริการเก็บ error อื่นในอนาคต
    console.error("[app] เกิดข้อผิดพลาดที่ไม่ได้จัดการ:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground">เกิดข้อผิดพลาดบางอย่าง</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          ระบบทำงานผิดพลาดชั่วคราว ลองใหม่อีกครั้งได้เลยครับ ถ้ายังเจอปัญหาเดิม
          รบกวนแจ้งเราผ่านหน้าติดต่อ
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">รหัสอ้างอิง: {error.digest}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          ลองใหม่
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">
            <Home className="h-4 w-4" aria-hidden="true" />
            กลับหน้าแรก
          </Link>
        </Button>
      </div>
    </div>
  )
}
