"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import { Loader2, AlertTriangle, UserMinus, Mail, Phone, ShoppingBag, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string | null
  email: string | null
  nickname: string | null
  phone: string | null
  role?: string
  _count?: {
    orders: number
    contactIssues: number
  }
}

interface DeleteUserDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  user: User | null
}

export function DeleteUserDialog({
  open,
  onClose,
  onSuccess,
  user,
}: DeleteUserDialogProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  if (!user) return null
  const orderCount = user._count?.orders || 0
  const issueCount = user._count?.contactIssues || 0

  
  // ตรวจสอบว่าเป็นตัวเอง
  const currentUserId = session?.user?.id
  const isSelf = currentUserId === user.id

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`ลบสมาชิก "${user.nickname || user.name || user.email}" สำเร็จ`)
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาดในการลบสมาชิก")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("เกิดข้อผิดพลาดในการลบสมาชิก")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-background border-border text-foreground max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl flex items-center gap-2 text-foreground">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            ยืนยันการลบสมาชิก
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          {/* ข้อความถ้าเป็นตัวเอง */}
          {isSelf ? (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-destructive/10 rounded-lg mt-0.5">
                  <ShieldAlert className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-destructive font-medium">
                    ไม่สามารถลบบัญชีตัวเองได้
                  </p>
                  <p className="text-destructive/80 text-sm mt-1">
                    คุณไม่สามารถลบบัญชีของตัวเองได้ หากต้องการลบบัญชี กรุณาให้ Admin ท่านอื่นดำเนินการแทน
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* User Info Card */}
              <div className="bg-card/50 rounded-xl p-4 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <UserMinus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {user.name || "ไม่ระบุชื่อ"}
                    </p>
                    {user.nickname && (
                      <p className="text-sm text-muted-foreground">({user.nickname})</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 pl-2 border-l-2 border-border ml-4">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {user.email}
                  </div>
                  {user.phone && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {user.phone}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                    จองแล้ว {orderCount} ครั้ง
                  </div>
                </div>
              </div>

              {/* Info/Warning Message */}
              {orderCount > 0 || issueCount > 0 ? (
                <div className="bg-info/10 border border-info/30 rounded-xl p-4 space-y-2">
                  <p className="text-info font-medium text-sm">ข้อมูลต่อไปนี้จะถูกเก็บไว้</p>
                  <div className="space-y-1 text-info/80 text-xs pl-1">
                    {orderCount > 0 && (
                      <p>ใบจอง {orderCount} รายการ (รวมใบเสนอราคา)</p>
                    )}
                    {issueCount > 0 && (
                      <p>ใบแจ้งปัญหา {issueCount} รายการ</p>
                    )}
                  </div>
                  <p className="text-info/50 text-xs">ข้อมูลจะยังอยู่ในระบบ แต่จะไม่แสดงชื่อสมาชิก</p>
                </div>
              ) : (
                <div className="bg-card/50 rounded-xl p-4 border border-border">
                  <p className="text-muted-foreground text-sm text-center">
                    สมาชิกรายนี้ไม่มีประวัติการทำรายการ
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <AlertDialogFooter className="border-t border-border pt-4">
          <AlertDialogCancel
            className="bg-card border-border text-foreground hover:bg-secondary hover:text-foreground"
            disabled={loading}
          >
            {isSelf ? "ปิด" : "ยกเลิก"}
          </AlertDialogCancel>
          {!isSelf && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                <>
                  <UserMinus className="w-4 h-4 mr-2" />
                  ยืนยันการลบ
                </>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}