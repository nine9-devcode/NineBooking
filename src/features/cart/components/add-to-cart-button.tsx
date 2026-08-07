"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ShoppingCart, Plus, Minus, Loader2, Check, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/features/cart/cart-context"
import type { SelectedPairedProduct } from "@/features/products/components/paired-products"

interface AddToCartButtonProps {
  productId: string
  productName: string
  pairedProducts?: SelectedPairedProduct[]
  showQuantity?: boolean
  className?: string
}

export function AddToCartButton({
  productId,
  productName,
  pairedProducts = [],
  showQuantity = true,
  className = "",
}: AddToCartButtonProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { addToCart } = useCart()

  // จำนวนสินค้าหลัก
  const [mainQuantity, setMainQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // เพิ่มจำนวนสินค้าหลัก
  const increaseMainQuantity = () => {
    setMainQuantity((prev) => prev + 1)
  }

  // ลดจำนวนสินค้าหลัก
  const decreaseMainQuantity = () => {
    setMainQuantity((prev) => (prev > 1 ? prev - 1 : 1))
  }

  // เพิ่มลงตะกร้า
  const handleAddToCart = async () => {
    // ถ้ายังไม่ login ให้ไปหน้า login
    if (!session?.user) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname))
      return
    }

    setIsLoading(true)
    setIsSuccess(false)

    try {
      const cartItems: {
        productId: string
        quantity: number
        pairedProductId: string | null
      }[] = []

      // สินค้าหลัก
      cartItems.push({
        productId,
        quantity: mainQuantity,
        pairedProductId: null,
      })

      // สินค้าคู่
      if (pairedProducts.length > 0) {
        for (const paired of pairedProducts) {
          cartItems.push({
            productId,
            quantity: paired.quantity,
            pairedProductId: paired.productId,
          })
        }
      }

      // เพิ่มทั้งหมดลงตะกร้า
      const results = await Promise.all(cartItems.map((item) => addToCart(item)))

      // ถ้าทุกอันสำเร็จ
      if (results.every((r) => r)) {
        setIsSuccess(true)
        setMainQuantity(1) // Reset
        setTimeout(() => setIsSuccess(false), 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // นับจำนวนรวมทั้งหมด
  const totalPairedQuantity = pairedProducts.reduce((sum, p) => sum + p.quantity, 0)
  const totalItemsToAdd = mainQuantity + totalPairedQuantity

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ตัวเลือกจำนวนสินค้าหลัก */}
      {showQuantity && (
        <div className="bg-muted rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">จำนวนสินค้าหลัก</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-border rounded-lg bg-card">
                <button
                  type="button"
                  onClick={decreaseMainQuantity}
                  disabled={mainQuantity <= 1 || isLoading}
                  className="p-2.5 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-14 text-center font-semibold text-lg">{mainQuantity}</span>
                <button
                  type="button"
                  onClick={increaseMainQuantity}
                  disabled={isLoading}
                  className="p-2.5 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-muted-foreground">ชิ้น</span>
            </div>
          </div>
        </div>
      )}

      {/* สรุปรายการ */}
      {(mainQuantity > 0 || pairedProducts.length > 0) && (
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
          <p className="text-sm font-medium text-foreground mb-2">สรุปรายการที่จะเพิ่ม:</p>
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between text-muted-foreground">
              <span>• {productName}</span>
              <span className="font-medium">{mainQuantity} ชิ้น</span>
            </li>
            {pairedProducts.map((p, idx) => (
              <li key={idx} className="flex justify-between text-muted-foreground">
                <span className="pl-2">
                  ↳ คู่กับ: {p.productName || `สินค้าคู่ ${idx + 1}`}
                </span>
                <span>{p.quantity} ชิ้น</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-primary/20 mt-3 pt-3 flex justify-between font-semibold">
            <span>รวมทั้งหมด</span>
            <span className="text-primary">{totalItemsToAdd} รายการ</span>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <Button
        onClick={handleAddToCart}
        disabled={isLoading}
        size="lg"
        className={`w-full transition-all duration-300 ${
          isSuccess ? "bg-success hover:bg-success" : "bg-primary hover:bg-primary/90"
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            กำลังเพิ่ม...
          </>
        ) : isSuccess ? (
          <>
            <Check className="w-5 h-5 mr-2" />
            เพิ่มลงตะกร้าแล้ว!
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5 mr-2" />
            เพิ่มลงตะกร้า
            <span className="ml-1 px-2 py-0.5 bg-primary-foreground/20 rounded-full text-sm">
              {totalItemsToAdd} รายการ
            </span>
          </>
        )}
      </Button>

      {/* Login hint */}
      {!session?.user && (
        <p className="text-xs text-muted-foreground text-center">
          * กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า
        </p>
      )}
    </div>
  )
}
