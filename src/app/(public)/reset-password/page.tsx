"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { AuthShell } from "@/features/auth/components/auth-shell"
import { FormAlert } from "@/features/auth/components/form-alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetPasswordContent() {
  const router = useRouter()
  const token = useSearchParams().get("token") ?? ""

  const [status, setStatus] = useState<"checking" | "valid" | "invalid">("checking")
  const [tokenError, setTokenError] = useState("")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // เช็คลิงก์ก่อน จะได้ไม่ให้ผู้ใช้กรอกฟอร์มเสร็จแล้วค่อยรู้ว่าลิงก์หมดอายุ
  useEffect(() => {
    if (!token) {
      setStatus("invalid")
      setTokenError("ไม่พบ token ในลิงก์")
      return
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setStatus("valid")
        } else {
          setStatus("invalid")
          setTokenError(data.error ?? "ลิงก์ไม่ถูกต้อง")
        }
      })
      .catch(() => {
        setStatus("invalid")
        setTokenError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ")
      })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
      return
    }
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
        return
      }

      router.push("/login?message=password-reset")
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "checking") {
    return (
      <AuthShell description="กำลังตรวจสอบลิงก์...">
        <div className="flex justify-center py-6">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      </AuthShell>
    )
  }

  if (status === "invalid") {
    return (
      <AuthShell description="ลิงก์ใช้งานไม่ได้">
        <div className="space-y-4">
          <FormAlert tone="error">{tokenError}</FormAlert>
          <Button asChild className="w-full">
            <Link href="/forgot-password">ขอลิงก์ใหม่</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell description="ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormAlert tone="error">{error}</FormAlert>}

        <div className="space-y-2">
          <Label htmlFor="password">รหัสผ่านใหม่</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              disabled={isLoading}
              required
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setError("")
            }}
            disabled={isLoading}
            required
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
        </Button>
      </form>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
