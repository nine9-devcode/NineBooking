// ไฟล์: app/orders/[id]/page.tsx

"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { GroupedItemsList } from "@/features/orders/components/grouped-items-list"
import { groupItemsByProduct } from "@/features/orders/group-items"
import { getResidenceTypeLabel } from "@/lib/constants"
import { CancelOrderDialog, getStatusConfig } from "@/features/orders/components"
import { useOrderNotifications } from "@/features/notifications/hooks/use-order-notifications"
import {
  Home,
  Loader2,
  Package,
  ArrowLeft,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Copy,
  Check,
  X,
} from "lucide-react"
import { toast } from "sonner"

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  customerName: string
  customerNickname: string | null
  customerEmail: string
  customerPhone: string
  shippingAddress: string | null
  shippingProvince: string | null
  shippingDistrict: string | null
  shippingSubDistrict: string | null
  shippingPostalCode: string | null
  shippingResidenceType: string | null
  customerNote: string | null
  adminNote: string | null
  totalItems: number
  totalQuantity: number
  items: {
    id: string
    quantity: number
    product: {
      id: string
      name: string
      image: string | null
      slug: string | null
      isActive: boolean
    }
    pairedProduct: {
      id: string
      name: string
      image: string | null
      slug: string | null
      isActive: boolean
    } | null
  }[]
  createdAt: string
  updatedAt: string
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { status: sessionStatus } = useSession()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  // Notification hook
  const { refresh: refreshNotifications } = useOrderNotifications()

  // Fetch order
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`)

        if (!res.ok) {
          if (res.status === 404) {
            setError("ไม่พบข้อมูลการจอง")
          } else if (res.status === 403) {
            setError("คุณไม่มีสิทธิ์ดูรายการนี้")
          } else {
            setError("เกิดข้อผิดพลาดในการโหลดข้อมูล")
          }
          return
        }

        const data = await res.json()
        setOrder(data.order)
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล")
      } finally {
        setLoading(false)
      }
    }

    if (sessionStatus === "authenticated" && orderId) {
      fetchOrder()
    }
  }, [orderId, sessionStatus])

  // Mark notification as read เมื่อเข้าหน้านี้
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await fetch("/api/user/order-notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        })
        // Refresh notification count ใน navbar
        refreshNotifications()
      } catch (err) {
        console.error("Error marking notification as read:", err)
      }
    }

    if (sessionStatus === "authenticated" && orderId) {
      markAsRead()
    }
  }, [orderId, sessionStatus, refreshNotifications])

  // Redirect ถ้ายังไม่ได้ login
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/orders")
    }
  }, [sessionStatus, router])

  // Group items
  const groupedItems = useMemo(() => {
    if (!order) return []
    return groupItemsByProduct(order.items)
  }, [order])

  // Copy order number
  const handleCopy = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Handle cancel order
  const handleConfirmCancel = async () => {
    if (!order) return

    setIsCancelling(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("ยกเลิกคำสั่งจองเรียบร้อยแล้ว")
        // อัพเดท state
        setOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : null))
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการยกเลิก")
    } finally {
      setIsCancelling(false)
      setCancelDialogOpen(false)
    }
  }

  // Format address
  const formatAddress = () => {
    if (!order) return null
    const parts = [
      order.shippingAddress,
      order.shippingSubDistrict,
      order.shippingDistrict,
      order.shippingProvince,
      order.shippingPostalCode,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(" ") : null
  }

  // Loading session
  if (sessionStatus === "loading" || loading) {
    return (
      <>
        <Navbar currentPage="รายละเอียดการจอง" />
        <div className="pt-16 min-h-screen bg-muted flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </>
    )
  }

  if (sessionStatus === "unauthenticated") {
    return null
  }

  // Error
  if (error || !order) {
    return (
      <>
        <Navbar currentPage="รายละเอียดการจอง" />
        <div className="pt-16 min-h-screen bg-muted flex items-center justify-center">
          <div className="text-center">
            <Package className="w-16 h-16 text-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-2">
              {error || "ไม่พบข้อมูลการจอง"}
            </h1>
            <Link href="/orders">
              <Button>กลับไปประวัติการจอง</Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon
  const formattedAddress = formatAddress()
  const canCancel = order.status === "PENDING"

  return (
    <>
      <Navbar currentPage="รายละเอียดการจอง" />

      <div className="pt-16 min-h-screen bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/orders"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {order.orderNumber}
                </h1>
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="คัดลอกเลขที่ใบจอง"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Status Card */}
          <div
            className={`rounded-xl border p-4 mb-6 ${statusConfig.color} ${statusConfig.borderColor}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIcon className="w-6 h-6" />
                <div>
                  <p className="font-semibold">{statusConfig.label}</p>
                  <p className="text-sm opacity-80">{statusConfig.description}</p>
                </div>
              </div>

              {/* ปุ่มยกเลิก - แสดงเฉพาะ PENDING */}
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <X className="w-4 h-4 mr-2" />
                  ยกเลิกคำสั่งจอง
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Order Items + Notes */}
            <div className="lg:col-span-2 space-y-6">
              {/* รายการสินค้า - Grouped */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    รายการสินค้า
                    <span className="text-sm font-normal text-muted-foreground">
                      ({groupedItems.length} รายการ • {order.totalQuantity} ชิ้น)
                    </span>
                  </h2>
                </div>

                <GroupedItemsList items={groupedItems} showLinks />

                {/* Summary */}
                <div className="px-6 py-4 bg-muted border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">รวมทั้งหมด</span>
                    <span className="font-semibold text-foreground">
                      {order.totalQuantity} ชิ้น
                    </span>
                  </div>
                </div>
              </div>

              {/* หมายเหตุ */}
              {(order.customerNote || order.adminNote) && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-6 py-4 border-b border-border bg-muted">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      หมายเหตุ
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {order.customerNote && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">จากลูกค้า:</p>
                        <p className="text-foreground bg-muted p-3 rounded-lg">
                          {order.customerNote}
                        </p>
                      </div>
                    )}
                    {order.adminNote && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">จากทางร้าน:</p>
                        <p className="text-foreground bg-info/10 p-3 rounded-lg border border-info/40">
                          {order.adminNote}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Customer Info */}
            <div className="space-y-6">
              {/* ข้อมูลผู้จอง */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    ข้อมูลผู้จอง
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <span className="text-foreground">{order.customerName}</span>
                      {order.customerNickname && (
                        <span className="text-muted-foreground ml-1">
                          ({order.customerNickname})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{order.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{order.customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* ที่อยู่จัดส่ง */}
              {(formattedAddress || order.shippingResidenceType) && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-6 py-4 border-b border-border bg-muted">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      ที่อยู่จัดส่ง
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* แสดงประเภทที่อยู่อาศัย */}
                    {order.shippingResidenceType && (
                      <div className="flex items-center gap-3 pb-3 border-b border-border">
                        <Home className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            ประเภทที่พัก
                          </p>
                          <p className="text-foreground font-medium">
                            {getResidenceTypeLabel(order.shippingResidenceType)}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* ที่อยู่ละเอียด */}
                    {formattedAddress && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <p className="text-foreground leading-relaxed">
                          {formattedAddress}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    ไทม์ไลน์
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-0">
                    {/* สร้างใบจอง */}
                    <div className="flex items-start gap-3 relative pb-4">
                      {order.updatedAt !== order.createdAt && (
                        <div className="absolute left-[3px] top-3 w-0.5 h-full bg-secondary" />
                      )}
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          สร้างใบจอง
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* สถานะอัพเดท */}
                    {order.updatedAt !== order.createdAt && (
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                            order.status === "CANCELLED"
                              ? "bg-destructive"
                              : order.status === "COMPLETED"
                              ? "bg-success"
                              : order.status === "CONFIRMED"
                              ? "bg-info"
                              : "bg-warning"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {statusConfig.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.updatedAt).toLocaleDateString(
                              "th-TH",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <CancelOrderDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        orderNumber={order.orderNumber}
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
      />
    </>
  )
}