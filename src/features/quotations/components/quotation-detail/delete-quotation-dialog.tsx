// components/admin/quotations/quotation-detail/delete-quotation-dialog.tsx

"use client"

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
import { Loader2 } from "lucide-react"

interface DeleteQuotationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  quotationNumber: string
  isDeleting: boolean
}

export function DeleteQuotationDialog({
  isOpen,
  onClose,
  onConfirm,
  quotationNumber,
  isDeleting,
}: DeleteQuotationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            ยืนยันการลบใบเสนอราคา?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            คุณกำลังจะลบใบเสนอราคา <span className="text-foreground font-semibold">{quotationNumber}</span>
            <br />
            การลบจะไม่สามารถกู้คืนได้ คุณต้องการดำเนินการต่อหรือไม่?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={isDeleting}
            className="bg-secondary text-foreground border-border hover:bg-secondary"
          >
            ยกเลิก
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังลบ...
              </>
            ) : (
              "ลบใบเสนอราคา"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}