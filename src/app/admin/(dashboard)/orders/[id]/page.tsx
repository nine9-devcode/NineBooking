"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useAdminNotifications } from "@/features/notifications/admin-notification-context"
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
import { toast } from "sonner"
import { Loader2, Package, ArrowLeft, Save, Copy, Check, FileText } from "lucide-react"
import {
  OrderDetail,
  OrderStatusCard,
  OrderItemsList,
  OrderCustomerInfo,
  OrderShippingInfo,
  OrderCustomerNote,
  OrderAdminNote,
  OrderTimeline,
  formatDate,
} from "@/features/orders/components/admin"
import { ExportPdfButton } from "@/features/dashboard/components/export-buttons"
import { QuotationModal, OrderItemForQuotation } from "@/features/quotations/components"

export default function AdminOrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  // Edit state
  const [newStatus, setNewStatus] = useState("")
  const [adminNote, setAdminNote] = useState("")
  const [hasChanges, setHasChanges] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState("")

  const [showQuotationModal, setShowQuotationModal] = useState(false)
  const { refreshCounts } = useAdminNotifications()

  // Fetch order
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`)
        if (!res.ok) {
          setError("ไม่พบข้อมูลคำสั่งจอง")
          return
        }
        const data = await res.json()
        setOrder(data.order)
        setNewStatus(data.order.status)
        setAdminNote(data.order.adminNote || "")
        // Mark order notifications as read
        fetch(`/api/admin/orders/${orderId}/mark-read`, { method: "PATCH" }).then(() =>
          refreshCounts()
        )
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล")
      } finally {
        setLoading(false)
      }
    }

    if (orderId) fetchOrder()
  }, [orderId])

  // Track changes
  useEffect(() => {
    if (order) {
      const statusChanged = newStatus !== order.status
      const noteChanged = adminNote !== (order.adminNote || "")
      setHasChanges(statusChanged || noteChanged)
    }
  }, [newStatus, adminNote, order])

  // Handlers
  const handleCopy = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleStatusChange = (value: string) => {
    if (value === "CANCELLED" && order?.status !== "CANCELLED") {
      setPendingStatus(value)
      setShowConfirmDialog(true)
    } else {
      setNewStatus(value)
    }
  }

  const confirmStatusChange = () => {
    setNewStatus(pendingStatus)
    setShowConfirmDialog(false)
    setPendingStatus("")
  }

  const handleSave = async () => {
    if (!hasChanges || !order) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNote: adminNote || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error("เกิดข้อผิดพลาด", {
          description: data.error || "ไม่สามารถบันทึกได้",
        })
        return
      }

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: data.order.status,
              adminNote: data.order.adminNote,
              updatedAt: data.order.updatedAt,
            }
          : null
      )
      setHasChanges(false)
      toast.success("บันทึกสำเร็จ", {
        description: "อัพเดทคำสั่งจองเรียบร้อยแล้ว",
      })
    } catch (err) {
      toast.error("เกิดข้อผิดพลาด", {
        description: "ไม่สามารถบันทึกได้ กรุณาลองใหม่",
      })
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Package className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">
          {error || "ไม่พบคำสั่งจอง"}
        </h1>
        <Link href="/admin/orders">
          <Button>กลับไปรายการ</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{order.orderNumber}</h1>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-secondary rounded transition-colors"
                title="คัดลอก"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              สร้างเมื่อ {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* ปุ่ม Export */}
        <div className="flex items-center gap-2">
          {/* ปุ่มส่งออกใบจอง PDF (เดิม) */}
          <ExportPdfButton
            url={`/api/admin/orders/${orderId}/pdf`}
            filename={`order-${order.orderNumber}.pdf`}
          />

          <Button
            variant="outline"
            className="bg-transparent text-foreground border-border hover:bg-card transition-colors"
            onClick={() => setShowQuotationModal(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            สร้างใบเสนอราคา
          </Button>

          {/* ปุ่มบันทึก */}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
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
                บันทึกการเปลี่ยนแปลง
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <OrderStatusCard
            currentStatus={order.status}
            newStatus={newStatus}
            onStatusChange={handleStatusChange}
            cancelledBy={order.cancelledBy}
          />
          <OrderItemsList
            items={order.items}
            totalItems={order.totalItems}
            totalQuantity={order.totalQuantity}
            mainQuantity={order.mainQuantity}
            pairedQuantity={order.pairedQuantity}
          />
          <OrderAdminNote note={adminNote} onChange={setAdminNote} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <OrderCustomerInfo customer={order.customer} user={order.user} />
          <OrderShippingInfo shipping={order.shipping} />
          <OrderCustomerNote note={order.customerNote} />
          <OrderTimeline createdAt={order.createdAt} updatedAt={order.updatedAt} />
        </div>
      </div>

      {/* Confirm Cancel Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              ยืนยันการยกเลิกคำสั่งจอง?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              คุณกำลังจะเปลี่ยนสถานะเป็น &quot;ยกเลิก&quot;
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-foreground border-border hover:bg-secondary">
              ไม่ใช่ ย้อนกลับ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className="bg-destructive hover:bg-destructive"
            >
              ใช่ ยกเลิกคำสั่งจอง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {order && (
        <QuotationModal
          orderId={order.id}
          orderNumber={order.orderNumber}
          orderItems={order.items as OrderItemForQuotation[]}
          customer={{
            name: order.customer.name,
            nickname: order.customer.nickname || null,
            email: order.customer.email,
            phone: order.customer.phone,
          }}
          isOpen={showQuotationModal}
          onClose={() => setShowQuotationModal(false)}
          onSuccess={(quotationId) => {
            toast.success("สร้างใบเสนอราคาเรียบร้อย")
            // จะ redirect ไปหน้า detail อัตโนมัติจาก modal
          }}
        />
      )}
    </div>
  )
}
