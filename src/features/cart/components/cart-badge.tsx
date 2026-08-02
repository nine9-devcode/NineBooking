"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/features/cart/cart-context"
import { Button } from "@/components/ui/button"

export function CartBadge() {
  const { totalItems, isLoading } = useCart()

  return (
    <Link href="/cart">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        title="ตะกร้าสินค้า"
        aria-label={totalItems > 0 ? `ตะกร้าสินค้า (${totalItems} รายการ)` : "ตะกร้าสินค้า"}
      >
        <ShoppingCart className="h-5 w-5" />
        
        {/* Badge แสดงจำนวน */}
        {!isLoading && totalItems > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </Button>
    </Link>
  )
}