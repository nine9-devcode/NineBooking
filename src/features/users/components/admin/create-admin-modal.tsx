// components/admin/users/create-admin-modal.tsx
"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"

interface CreateAdminModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "" }

  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const level = Math.min(4, Math.max(1, Math.ceil(score * (4 / 5))))
  const configs = [
    { label: "อ่อนมาก", color: "bg-destructive" },
    { label: "อ่อน", color: "bg-primary" },
    { label: "ปานกลาง", color: "bg-warning" },
    { label: "แข็งแกร่ง", color: "bg-success" },
  ]
  return { score: level, ...configs[level - 1] }
}

export function CreateAdminModal({ isOpen, onClose, onSuccess }: CreateAdminModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [form, setForm] = useState({
    name: "",
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim() || form.name.trim().length < 3 || form.name.trim().length > 40) {
      newErrors.name = "ชื่อต้องมี 3-40 ตัวอักษร"
    }
    if (form.nickname && (form.nickname.length < 1 || form.nickname.length > 20)) {
      newErrors.nickname = "ชื่อเล่นต้องมี 1-20 ตัวอักษร"
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "กรุณากรอกอีเมลให้ถูกต้อง"
    }
    if (!form.password || form.password.length < 6 || form.password.length > 50) {
      newErrors.password = "รหัสผ่านต้องมี 6-50 ตัวอักษร"
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน"
    }
    if (!form.phone || !/^0[689]\d{8}$/.test(form.phone)) {
      newErrors.phone = "เบอร์โทรไม่ถูกต้อง (ต้องขึ้นต้นด้วย 06, 08, 09 และมี 10 หลัก)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          nickname: form.nickname.trim() || undefined,
          email: form.email.trim(),
          password: form.password,
          phone: form.phone,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setErrors((prev) => ({ ...prev, email: data.error }))
        } else {
          toast.error(data.error || "เกิดข้อผิดพลาด")
        }
        return
      }

      toast.success(`เพิ่มแอดมิน "${data.user.name}" สำเร็จ`)
      handleClose()
      onSuccess()
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setForm({ name: "", nickname: "", email: "", password: "", confirmPassword: "", phone: "" })
    setErrors({})
    setShowPassword(false)
    setShowConfirm(false)
    onClose()
  }

  const strength = getPasswordStrength(form.password)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="w-5 h-5 text-primary" />
            เพิ่มแอดมินใหม่
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-foreground">
              ชื่อ-นามสกุล <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="ชื่อจริง นามสกุล"
              disabled={isLoading}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Nickname */}
          <div className="space-y-1.5">
            <Label className="text-foreground">ชื่อเล่น</Label>
            <Input
              value={form.nickname}
              onChange={(e) => handleChange("nickname", e.target.value)}
              placeholder="ชื่อเล่น (ไม่บังคับ)"
              disabled={isLoading}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
            {errors.nickname && <p className="text-xs text-destructive">{errors.nickname}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-foreground">
              อีเมล <span className="text-destructive">*</span>
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="admin@example.com"
              disabled={isLoading}
              autoComplete="off"
              className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label className="text-foreground">
              รหัสผ่าน <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                disabled={isLoading}
                autoComplete="new-password"
                className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= strength.score ? strength.color : "bg-secondary"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  ความแข็งแกร่ง: <span className="font-medium">{strength.label}</span>
                </p>
              </div>
            )}
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label className="text-foreground">
              ยืนยันรหัสผ่าน <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                placeholder="ยืนยันรหัสผ่าน"
                disabled={isLoading}
                autoComplete="new-password"
                className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-foreground">
              เบอร์โทรศัพท์ <span className="text-destructive">*</span>
            </Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                handleChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="เบอร์โทรศัพท์ 10 หลัก"
              disabled={isLoading}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 border-border bg-secondary text-foreground hover:bg-secondary hover:text-foreground"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังสร้าง...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                เพิ่มแอดมิน
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
