// ไฟล์: components/orders/cancel-order-dialog.tsx

"use client"

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

interface CancelOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderNumber: string
  isLoading: boolean
  onConfirm: () => void
}

export function CancelOrderDialog({
  open,
  onOpenChange,
  orderNumber,
  isLoading,
  onConfirm,
}: CancelOrderDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการยกเลิกคำสั่งจอง</AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการยกเลิกคำสั่งจอง{" "}
            <span className="font-semibold text-foreground">{orderNumber}</span> ใช่หรือไม่?
            <br />
            <span className="text-destructive">การยกเลิกไม่สามารถย้อนกลับได้</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>ไม่ใช่</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังยกเลิก...
              </>
            ) : (
              "ยืนยันยกเลิก"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
