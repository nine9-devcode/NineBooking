"use client"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  slug: string
  datasheets?: any | null
  _count?: {
    orderItems: number
    exclusivePairingsA?: number
    exclusivePairingsB?: number
  }
}

interface DeleteProductDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  product: Product | null
  onDeleteStart?: () => void
  onDeleteEnd?: () => void
}

export function DeleteProductDialog({
  open,
  onClose,
  onSuccess,
  product,
  onDeleteStart,
  onDeleteEnd,
}: DeleteProductDialogProps) {
  const [loading, setLoading] = useState(false)

  const hasOrders = (product?._count?.orderItems ?? 0) > 0

  const handleDelete = async () => {
    if (!product) return

    setLoading(true)
    onDeleteStart?.()
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("ลบสินค้าสำเร็จ")
        onSuccess()
        onClose()
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("เกิดข้อผิดพลาดในการลบสินค้า")
    } finally {
      setLoading(false)
      onDeleteEnd?.()
    }
  }

  if (!product) return null

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-background border-border text-foreground">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">ยืนยันการลบสินค้า</AlertDialogTitle>
          </div>

          <AlertDialogDescription asChild>
            <div className="text-muted-foreground space-y-3">
              <div className="text-sm">
                คุณต้องการลบสินค้า{" "}
                <span className="text-foreground font-semibold">
                  &quot;{product.name}&quot;
                </span>{" "}
                ใช่หรือไม่?
              </div>

              <div className="bg-card/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Slug:</span>
                  <span className="text-foreground font-mono">{product.slug}</span>
                </div>
                {product._count && product._count.orderItems > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">คำสั่งจองที่เกี่ยวข้อง:</span>
                    <Badge variant="outline" className="border-warning/40 text-warning">
                      {product._count.orderItems} รายการ
                    </Badge>
                  </div>
                )}
              </div>

              {hasOrders && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  <div className="text-destructive text-sm">
                    <p className="font-medium">ไม่สามารถลบได้</p>
                    <p className="mt-1 text-destructive">
                      สินค้านี้มีคำสั่งจองที่เกี่ยวข้อง {product._count!.orderItems} รายการ
                      กรุณายกเลิกหรือจัดการคำสั่งจองก่อน
                    </p>
                  </div>
                </div>
              )}

              <div className="text-destructive text-sm font-semibold">
                ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            className="bg-card border-border text-foreground hover:bg-secondary hover:text-foreground"
          >
            ยกเลิก
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={loading || hasOrders}
            className={
              hasOrders
                ? "bg-secondary text-muted-foreground cursor-not-allowed"
                : "bg-destructive hover:bg-destructive text-destructive-foreground"
            }
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            ลบสินค้า
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
