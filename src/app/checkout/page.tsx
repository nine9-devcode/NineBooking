// app/checkout/page.tsx
"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navbar } from "@/components/layout/navbar"
import { groupItemsByProduct, calculateGroupedSummary } from "@/features/orders/group-items"
import { useCart } from "@/features/cart/cart-context"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/layout/footer"

// Components
import {
  CheckoutHeader,
  CheckoutError,
  CustomerInfoSection,
  ShippingSection,
  NotesSection,
  CheckoutSummary,
  EmptyCartState,
} from "@/features/orders/components/checkout"

// Hooks
import { useCheckoutForm } from "@/features/orders/hooks/use-checkout-form"
import { useCheckoutSubmit } from "@/features/orders/hooks/use-checkout-submit"

// Types
import type { CartItem } from "@/features/orders/checkout.types"

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { items, refreshCart } = useCart()

  const [selectedItems, setSelectedItems] = useState<CartItem[]>([])

  // Custom Hooks
  const { formData, handleChange, handleSelectChange } = useCheckoutForm(session)
  const { handleSubmit, isLoading, error, setError, fieldErrors, setFieldErrors } = useCheckoutSubmit({
    onRefreshCart: refreshCart,
  })

  // Wrapped onChange ที่ลบ field error เมื่อ user เริ่มแก้ไข
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleChange(e)
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[e.target.name]
        return next
      })
    }
  }

  // ตรวจสอบสถานะ login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/cart")
    }
  }, [status, router])

  // ดึงรายการที่เลือกจาก URL
  useEffect(() => {
    const itemIds = searchParams.get("items")?.split(",") || []

    if (itemIds.length > 0 && items.length > 0) {
      const selected = items.filter((item) => itemIds.includes(item.id))
      setSelectedItems(selected)
    }
  }, [searchParams, items])

  // จัดกลุ่มสินค้าและคำนวณสรุป
  const groupedItems = useMemo(() => {
    return groupItemsByProduct(selectedItems)
  }, [selectedItems])

  const summary = useMemo(() => {
    return calculateGroupedSummary(groupedItems)
  }, [groupedItems])

  // ส่งฟอร์ม
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("") 

    const cartItemIds = selectedItems.map((item) => item.id)
    await handleSubmit(formData, cartItemIds)
  }

  // สถานะกำลังโหลด
  if (status === "loading") {
    return (
      <>
        <Navbar currentPage="ยืนยันการจอง" />
        <div className="pt-16 min-h-screen bg-muted flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </>
    )
  }

  // รอ redirect ไป login
  if (status === "unauthenticated") {
    return null
  }

  // ไม่มีสินค้าที่เลือก
  if (selectedItems.length === 0 && !searchParams.get("items")) {
    return (
      <>
        <Navbar currentPage="ยืนยันการจอง" />
        <div className="pt-16 min-h-screen bg-muted">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <EmptyCartState />
          </div>
        </div>
      </>
    )
  }

  // หน้ายืนยันการจอง
  return (
    <>
      <Navbar currentPage="ยืนยันการจอง" />

      <div className="pt-16 min-h-screen bg-muted pb-24 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <CheckoutHeader />

          {/* Error Alert */}
          <CheckoutError message={error} />

          {/* Main Form */}
          <form onSubmit={onSubmit}>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: Form Sections */}
              <div className="flex-1 space-y-6">
                <CustomerInfoSection
                  formData={formData}
                  onChange={handleFieldChange}
                  isLoading={isLoading}
                  fieldErrors={fieldErrors}
                />

                <ShippingSection
                  formData={formData}
                  onChange={handleChange}
                  onSelectChange={handleSelectChange}
                  isLoading={isLoading}
                />

                <NotesSection
                  value={formData.customerNote}
                  onChange={handleChange}
                  isLoading={isLoading}
                />
              </div>

              {/* Right: Summary Sidebar */}
              <CheckoutSummary
                groupedItems={groupedItems}
                summary={summary}
                isLoading={isLoading}
              />
            </div>

            {/* Sticky Mobile Submit Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 lg:hidden">
              <div className="flex items-center justify-between max-w-6xl mx-auto">
                <div>
                  <p className="text-sm text-muted-foreground">รวมทั้งหมด</p>
                  <p className="text-lg font-bold text-primary">{summary.totalQuantity} ชิ้น</p>
                </div>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 px-6"
                  disabled={isLoading || groupedItems.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      ยืนยันการจอง
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <>
        <Navbar currentPage="ยืนยันการจอง" />
        <div className="pt-16 min-h-screen bg-muted flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </>
    }>
      <CheckoutContent />
    </Suspense>
  )
}