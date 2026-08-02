"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  ShoppingBag, 
  ArrowRight, 
  FileText,
  Loader2
} from "lucide-react"

interface OrderSummary {
  id: string
  orderNumber: string
  customerName: string
  totalQuantity: number
}

export default function OrderSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrderSummary = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (res.ok) {
          const data = await res.json()
          setOrder({
            id: data.order.id,
            orderNumber: data.order.orderNumber,
            customerName: data.order.customerName,
            totalQuantity: data.order.totalQuantity
          })
        }
      } catch (err) {
        console.error("Error fetching order summary:", err)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) fetchOrderSummary()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <Navbar currentPage="จองสำเร็จ" />
      
      <div className="pt-16 min-h-screen bg-muted flex items-center justify-center">
        <div className="max-w-md w-full px-6 py-12 bg-card rounded-2xl shadow-sm border border-border text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
          </div>

          {/* Text Content */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            ส่งรายการจองเรียบร้อยแล้ว!
          </h1>
          <p className="text-muted-foreground mb-8">
            ขอบคุณคุณ <span className="font-medium text-foreground">{order?.customerName}</span> ที่ไว้วางใจใช้บริการของเรา
          </p>

          {/* Order Info Card */}
          <div className="bg-muted rounded-xl p-4 mb-8 border border-border text-left">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">เลขที่ใบจอง:</span>
              <span className="text-sm font-bold text-foreground">{order?.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">จำนวนสินค้า:</span>
              <span className="text-sm font-medium text-foreground">{order?.totalQuantity} ชิ้น</span>
            </div>
          </div>

          {/* Next Steps */}
          <div className="text-left mb-8">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              ขั้นตอนต่อไป:
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>เจ้าหน้าที่จะตรวจสอบรายการสินค้าภายใน 24 ชม.</li>
              <li>เจ้าหน้าที่จะติดต่อกลับผ่านเบอร์โทรศัพท์ที่ระบุไว้</li>
              <li>คุณสามารถตรวจสอบสถานะได้ที่หน้า &quot;ประวัติการจอง&quot;</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href={`/orders/${orderId}`}>
              <Button className="w-full bg-primary hover:bg-primary/90">
                ดูรายละเอียดการจอง
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ShoppingBag className="w-4 h-4 mr-2" />
                กลับหน้าหลัก
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}