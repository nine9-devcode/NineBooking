import Link from "next/link"
import { Home, SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="text-xl font-semibold text-foreground">ไม่พบหน้าที่คุณกำลังหา</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          หน้านี้อาจถูกย้าย ถูกลบ หรือลิงก์ที่เข้ามาพิมพ์ผิดครับ
        </p>
      </div>

      <Button asChild>
        <Link href="/">
          <Home className="h-4 w-4" aria-hidden="true" />
          กลับหน้าแรก
        </Link>
      </Button>
    </div>
  )
}
