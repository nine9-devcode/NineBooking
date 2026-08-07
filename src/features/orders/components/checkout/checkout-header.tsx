// components/checkout/checkout-header.tsx

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export function CheckoutHeader() {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Link href="/cart" className="p-2 hover:bg-muted rounded-lg transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-foreground">ยืนยันการจอง</h1>
        <p className="text-sm text-muted-foreground">กรอกข้อมูลเพื่อดำเนินการจองสินค้า</p>
      </div>
    </div>
  )
}
