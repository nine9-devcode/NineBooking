"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import { getErrorMessage } from "@/lib/utils"

interface EditPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Password strength calculator
function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "" }

  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  // Normalize to 1-4
  const level = Math.min(4, Math.max(1, Math.ceil(score * (4 / 5))))

  const configs = [
    { label: "อ่อนมาก", color: "bg-destructive" },
    { label: "อ่อน", color: "bg-primary" },
    { label: "ปานกลาง", color: "bg-warning" },
    { label: "แข็งแรง", color: "bg-success" },
  ]

  const config = configs[level - 1]
  return { score: level, label: config.label, color: config.color }
}

export function EditPasswordModal({ open, onOpenChange }: EditPasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [formErrors, setFormErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Show/hide password toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password strength
  const strength = useMemo(
    () => getPasswordStrength(formData.newPassword),
    [formData.newPassword]
  )

  // Reset form เมื่อเปิด Modal
  useEffect(() => {
    if (open) {
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setFormErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setError("")
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    }
  }, [open])

  // Validate Field
  const validateField = (name: string, value: string) => {
    let error = ""

    switch (name) {
      case "currentPassword":
        if (!value) {
          error = "กรุณากรอกรหัสผ่านปัจจุบัน"
        }
        break

      case "newPassword":
        if (value.length < 6) {
          error = "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"
        } else if (value.length > 50) {
          error = "รหัสผ่านใหม่ต้องไม่เกิน 50 ตัวอักษร"
        }
        break

      case "confirmPassword":
        if (value !== formData.newPassword) {
          error = "รหัสผ่านไม่ตรงกัน"
        }
        break
    }

    return error
  }

  // Handle Change with Validation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormErrors((prev) => ({ ...prev, [name]: validateField(name, value) }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const currentPasswordError = validateField("currentPassword", formData.currentPassword)
    const newPasswordError = validateField("newPassword", formData.newPassword)
    const confirmPasswordError = validateField("confirmPassword", formData.confirmPassword)

    if (currentPasswordError || newPasswordError || confirmPasswordError) {
      setFormErrors({
        currentPassword: currentPasswordError,
        newPassword: newPasswordError,
        confirmPassword: confirmPasswordError,
      })
      setError("กรุณาแก้ไขข้อมูลที่ไม่ถูกต้อง")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาด")
      }

      toast.success("เปลี่ยนรหัสผ่านสำเร็จ", {
        description: "รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว",
        duration: 3000,
      })

      onOpenChange(false)
    } catch (error: unknown) {
      toast.error("เกิดข้อผิดพลาด", {
        description: getErrorMessage(error),
        duration: 4000,
      })
      setError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">เปลี่ยนรหัสผ่าน</DialogTitle>
          <DialogDescription>กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm border border-destructive/40">
                {error}
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน *</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className={`pr-10 ${formErrors.currentPassword ? "border-destructive/40" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formErrors.currentPassword && (
                <p className="text-sm text-destructive">{formErrors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">รหัสผ่านใหม่ *</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  disabled={isLoading}
                  required
                  className={`pr-10 ${formErrors.newPassword ? "border-destructive/40" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formErrors.newPassword && (
                <p className="text-sm text-destructive">{formErrors.newPassword}</p>
              )}

              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          level <= strength.score ? strength.color : "bg-secondary"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">ความแข็งแรง: {strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่ *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className={`pr-10 ${formErrors.confirmPassword ? "border-destructive/40" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-sm text-destructive">{formErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
