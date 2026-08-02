// components/checkout/empty-cart-state.tsx
// แสดงเมื่อไม่มีสินค้าที่เลือก

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingBag, ArrowLeft } from "lucide-react"

export function EmptyCartState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-full mb-4">
          <ShoppingBag className="w-10 h-10 text-foreground" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">
          ไม่มีสินค้าที่เลือก
        </h1>
        <p className="text-muted-foreground mb-6">
          กรุณาเลือกสินค้าจากตะกร้าก่อน
        </p>
        <Link href="/cart">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปตะกร้า
          </Button>
        </Link>
      </div>
    </div>
  )
}