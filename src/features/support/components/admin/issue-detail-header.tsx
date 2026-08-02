// components/admin/contact-issues/issue-detail-header.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Save, Trash2, Calendar, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/utils"

interface IssueDetailHeaderProps {
  issueId: string
  issueNumber: string
  createdAt: string
  saving: boolean
  onSave: () => void
}

export function IssueDetailHeader({
  issueId,
  issueNumber,
  createdAt,
  saving,
  onSave,
}: IssueDetailHeaderProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/admin/contact-issues/${issueId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "ไม่สามารถลบได้")
      }

      toast.success("ลบรายการสำเร็จ")
      router.push("/admin/contact-issues")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left: Back + Issue Info */}
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/contact-issues")}
            className="text-muted-foreground hover:text-foreground hover:bg-card mt-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{issueNumber}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(createdAt), "d MMMM yyyy 'เวลา' HH:mm 'น.'", {
                locale: th,
              })}
            </p>
          </div>
        </div>

        {/* Right: Delete + Save */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            ลบ
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? (
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
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              ยืนยันการลบ
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              คุณแน่ใจหรือไม่ว่าต้องการลบรายการแจ้งปัญหา{" "}
              <span className="text-foreground font-medium">{issueNumber}</span>?
              <br />
              การกระทำนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-card text-foreground hover:bg-secondary border-border"
              disabled={deleting}
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive text-destructive-foreground"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  ลบ
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}