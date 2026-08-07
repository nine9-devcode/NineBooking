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
import { Loader2, AlertTriangle, FolderTree } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  slug: string
  parentId?: string | null
  _count: {
    products: number
    children?: number
  }
}

interface DeleteCategoryDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  category: Category | null
}

export function DeleteCategoryDialog({
  open,
  onClose,
  onSuccess,
  category,
}: DeleteCategoryDialogProps) {
  const [loading, setLoading] = useState(false)

  if (!category) return null

  const hasProducts = category._count.products > 0
  const hasChildren = (category._count.children ?? 0) > 0
  const canDelete = !hasProducts

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        if (data.deletedChildren > 0) {
          toast.success(
            `ลบหมวดหมู่ "${category.name}" และหมวดหมู่ย่อย ${data.deletedChildren} รายการสำเร็จ`
          )
        } else {
          toast.success(`ลบหมวดหมู่ "${category.name}" สำเร็จ`)
        }
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาดในการลบหมวดหมู่")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("เกิดข้อผิดพลาดในการลบหมวดหมู่")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-background border-border text-foreground max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            ยืนยันการลบหมวดหมู่
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          {/* Category Info */}
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <FolderTree className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{category.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">Slug: {category.slug}</div>
          </div>

          {/* Warning Messages */}
          {hasProducts ? (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-destructive font-medium">ไม่สามารถลบได้</p>
                  <p className="text-destructive text-sm mt-1">
                    หมวดหมู่นี้มีสินค้า {category._count.products} รายการ
                    กรุณาย้ายหรือลบสินค้าก่อน
                  </p>
                </div>
              </div>
            </div>
          ) : hasChildren ? (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-warning font-medium">คำเตือน</p>
                  <p className="text-warning text-sm mt-1">
                    หมวดหมู่นี้มีหมวดหมู่ย่อย {category._count.children} รายการ
                    <br />
                    การลบจะลบหมวดหมู่ย่อยทั้งหมดด้วย
                  </p>
                  <p className="text-warning/70 text-xs mt-2">
                    หากหมวดหมู่ย่อยมีสินค้าอยู่ จะไม่สามารถลบได้
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">
              คุณต้องการลบหมวดหมู่ &quot;{category.name}&quot; ใช่หรือไม่?
              <br />
              <span className="text-sm text-muted-foreground">
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </span>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            className="bg-card border-border text-foreground hover:bg-secondary hover:text-foreground"
            disabled={loading}
          >
            ยกเลิก
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={loading || !canDelete}
            className={
              canDelete
                ? "bg-destructive text-destructive-foreground hover:bg-destructive"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            }
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังลบ...
              </>
            ) : hasChildren ? (
              "ลบทั้งหมด"
            ) : (
              "ลบหมวดหมู่"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
