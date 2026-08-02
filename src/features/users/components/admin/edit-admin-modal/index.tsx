// components/admin/users/edit-admin-modal/index.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
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
import {
  Eye,
  EyeOff,
  Loader2,
  Save,
  ShieldCheck,
  Phone,
  Pencil,
  AlertTriangle,
} from "lucide-react"
import { getErrorMessage } from "@/lib/utils"

interface EditAdminModalProps {
  isOpen: boolean
  user: any | null
  onClose: () => void
  onSuccess: () => void
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

  const level = Math.min(4, Math.max(1, Math.ceil(score * (4 / 5))))
  const configs = [
    { label: "อ่อนมาก", color: "bg-destructive" },
    { label: "อ่อน", color: "bg-primary" },
    { label: "ปานกลาง", color: "bg-warning" },
    { label: "แข็งแรง", color: "bg-success" },
  ]
  return { score: level, ...configs[level - 1] }
}

export function EditAdminModal({ isOpen, user, onClose, onSuccess }: EditAdminModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Basic info
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")

  // Password
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  // Phone change flow
  const [showPhoneDialog, setShowPhoneDialog] = useState(false)
  const [newPhone, setNewPhone] = useState("")
  const [phoneError, setPhoneError] = useState("")

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword])

  // Reset on open
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || "")
      setNameError("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordError("")
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    }
  }, [isOpen, user])

  const validateName = (val: string) => {
    if (val.length < 3) return "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร"
    if (val.length > 40) return "ชื่อต้องไม่เกิน 40 ตัวอักษร"
    return ""
  }

  const handleSave = async () => {
    const ne = validateName(name)
    if (ne) { setNameError(ne); return }

    // Validate password if filled
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setPasswordError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
        return
      }
      if (newPassword.length > 50) {
        setPasswordError("รหัสผ่านต้องไม่เกิน 50 ตัวอักษร")
        return
      }
      if (newPassword !== confirmPassword) {
        setPasswordError("รหัสผ่านไม่ตรงกัน")
        return
      }
    }
    setPasswordError("")

    setIsLoading(true)
    try {
      const body: Record<string, any> = { name }
      if (newPassword) body.newPassword = newPassword

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด")

      toast.success("บันทึกข้อมูลสำเร็จ")
      onSuccess()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  // Phone flow
  const validateNewPhone = (phone: string) => {
    if (!phone) return "กรุณากรอกเบอร์โทรศัพท์"
    if (!/^0[689]\d{8}$/.test(phone)) return "รูปแบบเบอร์โทรไม่ถูกต้อง"
    if (phone === user?.phone) return "เบอร์ใหม่ต้องไม่ซ้ำกับเบอร์เดิม"
    return ""
  }

  const handleSavePhone = async () => {
    const err = validateNewPhone(newPhone)
    if (err) {
      setPhoneError(err)
      return
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newPhone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "ไม่สามารถบันทึกเบอร์โทรได้")
      toast.success("เปลี่ยนเบอร์โทรศัพท์สำเร็จ")
      setShowPhoneDialog(false)
      onSuccess()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
      setShowPhoneDialog(true)
    }
  }


  if (!user) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-background border-border text-foreground">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="w-5 h-5 text-primary" />
              แก้ไขข้อมูลผู้ดูแลระบบ
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-foreground">ชื่อ-นามสกุล *</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameError(validateName(e.target.value))
                }}
                maxLength={40}
                disabled={isLoading}
                className={`bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary ${nameError ? "border-destructive/40" : ""}`}
              />
              {nameError && <p className="text-sm text-destructive">{nameError}</p>}
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label className="text-foreground">อีเมล</Label>
              <Input
                value={user.email || ""}
                disabled
                className="bg-card/50 border-border text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">อีเมลไม่สามารถเปลี่ยนได้</p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="text-foreground">เบอร์โทรศัพท์</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={user.phone || "ยังไม่ได้ระบุ"}
                    disabled
                    className="bg-card/50 border-border text-muted-foreground pl-10 cursor-not-allowed"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setNewPhone(""); setPhoneError(""); setShowPhoneDialog(true) }}
                  disabled={isLoading}
                  className="border-border text-foreground hover:bg-secondary hover:text-foreground whitespace-nowrap"
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  เปลี่ยนเบอร์
                </Button>
              </div>
              
            </div>

            {/* Divider */}
            <div className="border-t border-border pt-2">
              <p className="text-xs text-muted-foreground mb-3">เปลี่ยนรหัสผ่าน (ไม่บังคับ)</p>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label className="text-foreground">รหัสผ่านใหม่</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError("") }}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  disabled={isLoading}
                  className={`bg-card border-border text-foreground placeholder:text-muted-foreground pr-10 focus-visible:ring-primary ${passwordError ? "border-destructive/40" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength indicator */}
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${level <= strength.score ? strength.color : "bg-secondary"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">ความแข็งแรง: {strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label className="text-foreground">ยืนยันรหัสผ่านใหม่</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError("") }}
                  disabled={isLoading}
                  className={`bg-card border-border text-foreground placeholder:text-muted-foreground pr-10 focus-visible:ring-primary ${passwordError ? "border-destructive/40" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="bg-card border-border text-foreground hover:bg-secondary hover:text-foreground"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึก
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone sub-dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-md bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">เปลี่ยนเบอร์โทรศัพท์</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {phoneError && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{phoneError}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-foreground">
                เบอร์โทรศัพท์ใหม่
                <span className="text-xs text-muted-foreground ml-2">({newPhone.length}/10)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={newPhone}
                  onChange={(e) => {
                    setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    setPhoneError("")
                  }}
                  placeholder="0812345678"
                  maxLength={10}
                  className={`pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary ${phoneError ? "border-destructive/40" : ""}`}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                เบอร์ปัจจุบัน: {user?.phone || "ยังไม่ได้ระบุ"}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPhoneDialog(false)}
                className="flex-1 bg-card border-border text-foreground hover:bg-secondary hover:text-foreground"
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                onClick={handleSavePhone}
                disabled={newPhone.length !== 10}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                บันทึกเบอร์ใหม่
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  )
}
