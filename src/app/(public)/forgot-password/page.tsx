"use client"

import { useState } from "react"
import Link from "next/link"
import { MailCheck } from "lucide-react"

import { AuthShell } from "@/features/auth/components/auth-shell"
import { FormAlert } from "@/features/auth/components/form-alert"
import { Button } from "@/components/ui/button"
import { CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [sentMessage, setSentMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
        return
      }

      setSentMessage(data.message)
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsLoading(false)
    }
  }

  if (sentMessage) {
    return (
      <AuthShell description="ตรวจสอบกล่องจดหมายของคุณ">
        <div className="space-y-4 text-center">
          <MailCheck className="mx-auto h-12 w-12 text-primary" />
          <p className="text-sm leading-relaxed text-muted-foreground">{sentMessage}</p>

          <p className="rounded-md border border-info/40 bg-info/10 p-3 text-left text-xs leading-relaxed text-info">
            <strong>หมายเหตุสำหรับโหมดพัฒนา:</strong> โปรเจกนี้ไม่ได้ต่อกับผู้ให้บริการอีเมลจริง
            อีเมลจะถูกบันทึกเป็นไฟล์ <code>.html</code> ไว้ในโฟลเดอร์{" "}
            <code>.dev-outbox/</code> ที่ราก repo — เปิดไฟล์ล่าสุดเพื่อกดลิงก์ตั้งรหัสผ่านใหม่ได้เลย
          </p>

          <Button asChild variant="outline" className="w-full">
            <Link href="/login">กลับไปหน้าเข้าสู่ระบบ</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      description="กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้"
      footer={
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </CardFooter>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormAlert tone="error">{error}</FormAlert>}

        <div className="space-y-2">
          <Label htmlFor="email">อีเมล</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError("")
            }}
            disabled={isLoading}
            required
            autoComplete="email"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || !email}>
          {isLoading ? "กำลังส่ง..." : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
        </Button>
      </form>
    </AuthShell>
  )
}
