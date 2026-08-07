"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Eye, EyeOff } from "lucide-react"

import { AuthShell } from "@/features/auth/components/auth-shell"
import { FormAlert } from "@/features/auth/components/form-alert"
import { Button } from "@/components/ui/button"
import { CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ERROR_MESSAGES: Record<string, string> = {
  ADMIN_NOT_ALLOWED: "บัญชีผู้ดูแลระบบต้องเข้าสู่ระบบผ่านหน้า /admin/login",
  INVALID_CREDENTIALS: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  CredentialsSignin: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  ACCOUNT_LOCKED: "กรอกรหัสผ่านผิดหลายครั้งเกินไป บัญชีถูกล็อคชั่วคราว 15 นาที",
}

const SUCCESS_MESSAGES: Record<string, string> = {
  registered: "สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ",
  "profile-completed": "บันทึกข้อมูลสำเร็จ กรุณาเข้าสู่ระบบอีกครั้งเพื่อเริ่มใช้งาน",
  "password-reset": "ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบ",
}

function getErrorMessage(code: string | null): string {
  if (!code) return ""
  return ERROR_MESSAGES[code] ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })

  // ข้อความที่ถูกส่งมาทาง query string (เช่นหลังสมัครสมาชิกเสร็จ)
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess(SUCCESS_MESSAGES.registered)
    }

    const message = searchParams.get("message")
    if (message && SUCCESS_MESSAGES[message]) {
      setSuccess(SUCCESS_MESSAGES[message])
    }

    const urlError = searchParams.get("error")
    if (urlError) {
      setError(getErrorMessage(urlError))
      setIsLoading(false)
      window.history.replaceState({}, "", "/login")
      router.refresh()
    }
  }, [searchParams, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!formData.email || !formData.password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน")
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        // NextAuth ส่ง code ที่เรากำหนดเองมาในฟิลด์ code
        const code = (result as { code?: string }).code ?? result.error
        setError(getErrorMessage(code))
        setIsLoading(false)
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      description="เข้าสู่ระบบเพื่อเริ่มจองสินค้า"
      footer={
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              สมัครสมาชิก
            </Link>
          </p>
        </CardFooter>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormAlert tone="error">{error}</FormAlert>}
        {success && <FormAlert tone="success">{success}</FormAlert>}

        <div className="space-y-2">
          <Label htmlFor="email">อีเมล</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="example@email.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">รหัสผ่าน</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="รหัสผ่าน"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              required
              autoComplete="current-password"
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

        <div className="text-right">
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            ลืมรหัสผ่าน?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          การเข้าสู่ระบบถือว่าท่านยอมรับ{" "}
          <Link href="/terms" className="text-primary hover:underline">
            ข้อกำหนดการใช้งาน
          </Link>{" "}
          และ{" "}
          <Link href="/privacy-policy" className="text-primary hover:underline">
            นโยบายความเป็นส่วนตัว
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
