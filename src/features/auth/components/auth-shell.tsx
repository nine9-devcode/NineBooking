import Link from "next/link"
import type { ReactNode } from "react"

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Logo } from "@/components/brand/logo"

/**
 * กรอบหน้าเดียวกันของทุกหน้าที่เกี่ยวกับบัญชี (login / register / forgot / reset)
 * เดิมแต่ละหน้าเขียน layout เองซ้ำๆ กัน
 */
export function AuthShell({
  description,
  children,
  footer,
}: {
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      {/* แสงน้ำเงินจางๆ ด้านหลังการ์ด ให้พื้นเข้มไม่ดูตัน */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent)]"
      />

      <Card className="relative w-full max-w-md">
        <CardHeader className="flex flex-col items-center space-y-3">
          <Link href="/" aria-label="กลับหน้าแรก" className="text-foreground">
            <Logo className="text-foreground" />
          </Link>
          <CardDescription className="text-center text-sm">{description}</CardDescription>
        </CardHeader>

        <CardContent>{children}</CardContent>

        {footer}
      </Card>
    </div>
  )
}
