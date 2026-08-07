"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

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
import { cn } from "@/lib/utils"

/**
 * กล่องยืนยันก่อนทำสิ่งที่ย้อนกลับไม่ได้
 *
 * แทนที่ delete-*-dialog สี่ตัวที่เป็นโครง AlertDialog เดียวกันราวหกร้อยบรรทัด
 * และแทน window.confirm() สองจุดในตะกร้า ซึ่งเป็นกล่องของระบบปฏิบัติการ
 * โผล่มาสีขาวกลางเว็บพื้นเข้ม
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  variant = "destructive",
  onConfirm,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: "destructive" | "default"
  /** ปิดกล่องให้เองเมื่อสำเร็จ — โยน error ออกมาได้ถ้าอยากให้กล่องค้างไว้ */
  onConfirm: () => void | Promise<void>
  /** เนื้อหาเสริม เช่น รายการสิ่งที่จะถูกลบไปด้วย */
  children?: React.ReactNode
}) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // ผู้เรียกเป็นคนแสดง toast เอง กล่องค้างไว้ให้กดใหม่ได้
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription asChild={typeof description !== "string"}>
            {typeof description === "string" ? description : <div>{description}</div>}
          </AlertDialogDescription>}
        </AlertDialogHeader>

        {children}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              // กันไม่ให้ Radix ปิดกล่องก่อนงานจะเสร็จ
              event.preventDefault()
              void handleConfirm()
            }}
            disabled={loading}
            className={cn(
              variant === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
