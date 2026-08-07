"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSession, signIn, signOut } from "next-auth/react"
import { AlertTriangle, Eye, EyeOff, Loader2, Lock, Mail, Shield, Timer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminLoginPage() {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })

  // นับถอยหลังตอนบัญชีถูกล็อคจากการกรอกรหัสผิดหลายครั้ง
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState("")

  useEffect(() => {
    if (!blockedUntil) {
      setCountdown("")
      return
    }

    const tick = () => {
      const diff = blockedUntil.getTime() - Date.now()

      if (diff <= 0) {
        setBlockedUntil(null)
        setCountdown("")
        setError("")
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setCountdown(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [blockedUntil])

  const checkLockStatus = useCallback(async (email: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/check-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (data.locked && data.blockedUntil) {
        setBlockedUntil(new Date(data.blockedUntil))
        setError("บัญชีถูกล็อคชั่วคราว เนื่องจากเข้าสู่ระบบผิดพลาดหลายครั้ง")
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (!blockedUntil) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.email || !formData.password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน")
      return
    }

    if (await checkLockStatus(formData.email)) return

    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        isAdminLogin: "true",
        redirect: false,
      })

      if (result?.error) {
        // อาจโดนล็อคพอดีจากครั้งนี้ — เช็คซ้ำเพื่อขึ้นข้อความให้ถูก
        const lockedNow = await checkLockStatus(formData.email)
        if (!lockedNow) setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        setIsLoading(false)
        return
      }

      const session = await getSession()

      // บัญชีผู้ใช้ทั่วไปเข้าหน้านี้ไม่ได้ — ขึ้นข้อความเดียวกับรหัสผ่านผิด
      // เพื่อไม่ให้เดาได้ว่าอีเมลไหนมีอยู่จริง
      if (session?.user?.role !== "admin") {
        await signOut({ redirect: false })
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        setIsLoading(false)
        return
      }

      router.push("/admin")
      router.refresh()
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
      setIsLoading(false)
    }
  }

  const isAccountLocked = Boolean(blockedUntil)

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />

      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <CardTitle className="text-2xl font-bold">ระบบหลังบ้าน</CardTitle>
              <CardDescription>NineBooking — Admin Panel</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                    isAccountLocked
                      ? "border-warning/40 bg-warning/10 text-warning"
                      : "border-destructive/40 bg-destructive/10 text-destructive"
                  }`}
                >
                  {isAccountLocked ? (
                    <Timer className="mt-0.5 h-5 w-5 shrink-0" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <span>{error}</span>
                    {isAccountLocked && countdown && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs opacity-70">ลองใหม่ได้ใน</span>
                        <span className="font-mono text-lg font-bold">{countdown}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@ninebooking.dev"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    autoComplete="email"
                    aria-label="อีเมลผู้ดูแลระบบ"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    autoComplete="current-password"
                    aria-label="รหัสผ่านผู้ดูแลระบบ"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-semibold"
                disabled={isLoading || isAccountLocked}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : isAccountLocked ? (
                  "บัญชีถูกล็อคชั่วคราว"
                ) : (
                  "เข้าสู่ระบบ"
                )}
              </Button>
            </form>

            <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-center text-xs text-muted-foreground">
                เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงได้
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                ← กลับไปหน้าเข้าสู่ระบบสำหรับผู้ใช้ทั่วไป
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
