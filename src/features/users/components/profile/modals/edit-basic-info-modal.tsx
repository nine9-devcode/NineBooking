// components/profile/modals/edit-basic-info-modal.tsx
"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation" 
import { useState, useEffect } from "react"
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
import { Loader2, Phone, AlertTriangle, Pencil } from "lucide-react"
import { getErrorMessage } from "@/lib/utils"

interface UserProfile {
  name: string
  email: string
  phone: string | null
  nickname: string | null
}

interface EditBasicInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: UserProfile
  onSuccess: () => void
}

export function EditBasicInfoModal({ open, onOpenChange, profile, onSuccess }: EditBasicInfoModalProps) {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
  })

  const [formErrors, setFormErrors] = useState({
    name: "",
    nickname: "",
  })

  // Phone Change State
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [newPhone, setNewPhone] = useState("")
  const [phoneError, setPhoneError] = useState("")

  // Reset form เมื่อเปิด Modal
  useEffect(() => {
    if (open) {
      setFormData({
        name: profile.name,
        nickname: profile.nickname || "",
      })
      setFormErrors({
        name: "",
        nickname: "",
      })
      setError("")
    }
  }, [open, profile])

  // Validate Field
  const validateField = (name: string, value: string) => {
    let error = ""

    switch (name) {
      case "name":
        if (value.length < 3) {
          error = "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร"
        } else if (value.length > 40) {
          error = "ชื่อต้องไม่เกิน 40 ตัวอักษร"
        } else if (!/^[ก-๙a-zA-Z\s]+$/.test(value)) {
          error = "ชื่อต้องเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น"
        }
        break

      case "nickname":
        if (value.length > 20) {
          error = "ชื่อเล่นต้องไม่เกิน 20 ตัวอักษร"
        }
        break
    }

    return error
  }

  // Handle Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "name" && value.length > 40) return
    if (name === "nickname" && value.length > 20) return

    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name in formErrors) {
      setFormErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
    }
    
    setError("")
  }

  // บันทึกข้อมูล (ไม่รวมเบอร์โทร)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const nameError = validateField("name", formData.name)
    const nicknameError = formData.nickname ? validateField("nickname", formData.nickname) : ""

    if (nameError || nicknameError) {
      setFormErrors({
        name: nameError,
        nickname: nicknameError,
      })
      setError("กรุณาแก้ไขข้อมูลที่ไม่ถูกต้อง")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          nickname: formData.nickname || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาด")
      }

      await update({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          nickname: formData.nickname,
        }
      })

      router.refresh()
      toast.success("อัพเดทข้อมูลสำเร็จ")
      onSuccess()
      onOpenChange(false)
    } catch (error: unknown) {
      toast.error("เกิดข้อผิดพลาด", { description: getErrorMessage(error) })
      setError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  // ========== Phone Change Functions ==========

  // เปิด Modal เปลี่ยนเบอร์
  const openPhoneModal = () => {
    setNewPhone("")
    setPhoneError("")
    setShowPhoneModal(true)
  }

  // Validate เบอร์ใหม่
  const validateNewPhone = (phone: string): string => {
    if (!phone) return "กรุณากรอกเบอร์โทรศัพท์"
    if (!/^\d+$/.test(phone)) return "เบอร์โทรต้องเป็นตัวเลขเท่านั้น"
    if (!/^0[689]\d{8}$/.test(phone)) return "รูปแบบเบอร์โทรไม่ถูกต้อง"
    if (phone === profile.phone) return "เบอร์ใหม่ต้องไม่ซ้ำกับเบอร์เดิม"
    return ""
  }

  // Handle เบอร์ใหม่เปลี่ยน
  const handleNewPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10)
    setNewPhone(value)
    setPhoneError("")
  }

  // บันทึกเบอร์ใหม่
  const handleSavePhone = async () => {
    const validationError = validateNewPhone(newPhone)
    if (validationError) {
      setPhoneError(validationError)
      return
    }

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newPhone }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "ไม่สามารถบันทึกเบอร์โทรได้")
      }

      await update({
        ...session,
        user: {
          ...session?.user,
          phone: newPhone,
        }
      })

      router.refresh()
      toast.success("เปลี่ยนเบอร์โทรศัพท์สำเร็จ")
      setShowPhoneModal(false)
      onSuccess()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "เกิดข้อผิดพลาด")
      setShowPhoneModal(true)
    }
  }


  return (
    <>
      {/* Main Edit Modal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">แก้ไขข้อมูลส่วนตัว</DialogTitle>
            <DialogDescription>
              อัพเดทชื่อและชื่อเล่น
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm border border-destructive/40">
                  {error}
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  ชื่อ-นามสกุล *
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formData.name.length}/40)
                  </span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className={formErrors.name ? "border-destructive/40" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
              </div>

              {/* Nickname Field */}
              <div className="space-y-2">
                <Label htmlFor="nickname">
                  ชื่อเล่น
                  {formData.nickname && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({formData.nickname.length}/20)
                    </span>
                  )}
                </Label>
                <Input
                  id="nickname"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  placeholder="ชื่อเล่น"
                  disabled={isLoading}
                  maxLength={20}
                />
              </div>

              {/* Divider - แยก editable fields กับ read-only fields */}
              <div className="border-t border-border pt-2">
                <p className="text-xs text-muted-foreground mb-3">ข้อมูลติดต่อ</p>
              </div>

              {/* Email Field (Disabled) */}
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-muted truncate"
                />
                <p className="text-xs text-muted-foreground">อีเมลไม่สามารถเปลี่ยนได้</p>
              </div>

              {/* Phone Field - Read Only with Change Button */}
              <div className="space-y-2">
                <Label>เบอร์โทรศัพท์</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={profile.phone || "ยังไม่ได้ระบุ"}
                      disabled
                      className="bg-muted pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openPhoneModal}
                    disabled={isLoading}
                    className="whitespace-nowrap"
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    เปลี่ยนเบอร์
                  </Button>
                </div>

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
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึก"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Phone Change Modal - กรอกเบอร์ใหม่ */}
      <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">เปลี่ยนเบอร์โทรศัพท์</DialogTitle>
            <DialogDescription>
              กรอกเบอร์โทรศัพท์ใหม่ที่ต้องการเปลี่ยน
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {phoneError && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/40">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{phoneError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPhone">
                เบอร์โทรศัพท์ใหม่
                <span className="text-xs text-muted-foreground ml-2">
                  ({newPhone.length}/10)
                </span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="newPhone"
                  value={newPhone}
                  onChange={handleNewPhoneChange}
                  placeholder="0812345678"
                  maxLength={10}
                  className={`pl-10 ${phoneError ? "border-destructive/40" : ""}`}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                เบอร์ปัจจุบัน: {profile.phone || "ยังไม่ได้ระบุ"}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPhoneModal(false)}
                className="flex-1"
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
