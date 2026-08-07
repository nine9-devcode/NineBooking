"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import {
  CartItemCard,
  groupCartItems,
  GroupedCartItem,
} from "@/features/cart/components/cart-item"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useCart } from "@/features/cart/cart-context"
import { Footer } from "@/components/layout/footer"
import {
  ShoppingCart,
  Loader2,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Package,
  CheckSquare,
  Square,
} from "lucide-react"

export default function CartPage() {
  const router = useRouter()
  const { status } = useSession()
  const { items, totalItems, isLoading, clearCart } = useCart()

  // State สำหรับ grouped items และ selected items
  const [groupedItems, setGroupedItems] = useState<GroupedCartItem[]>([])
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // ไม่บันทึก selection จนกว่าจะโหลดเสร็จ
    if (!isInitialized) return

    if (groupedItems.length > 0) {
      const selectedArray = Array.from(selectedGroups)
      localStorage.setItem("cart_selection", JSON.stringify(selectedArray))
    }
  }, [selectedGroups, groupedItems, isInitialized])

  // Group items เมื่อ items เปลี่ยน
  useEffect(() => {
    const groups = groupCartItems(items)
    setGroupedItems(groups)

    // ถ้าไม่มีของ ไม่ต้องทำอะไร
    if (groups.length === 0) return

    const savedSelection = localStorage.getItem("cart_selection")
    let hasLoadedFromStorage = false

    if (savedSelection) {
      try {
        const parsedSelection = JSON.parse(savedSelection)
        const savedSet = new Set(parsedSelection)

        const currentGroupIds = groups.map((g) => g.groupId)
        const validSelection = currentGroupIds.filter((id) => savedSet.has(id))

        // ถ้ามีค่าที่เคยเซฟไว้ (หรือเคยเซฟว่าเป็นค่าว่าง [])
        setSelectedGroups(new Set(validSelection as string[]))
        hasLoadedFromStorage = true
      } catch (e) {
        console.error("Error parsing cart selection", e)
      }
    }

    // ถ้าไม่มีเซฟไว้เลย ให้เลือกทั้งหมดเป็น Default
    if (!hasLoadedFromStorage) {
      setSelectedGroups(new Set(groups.map((g) => g.groupId)))
    }

    // บอกว่าโหลดเสร็จแล้ว (ยอมให้ Save ได้ใน Effect ถัดไป)
    setIsInitialized(true)
  }, [items])

  // Redirect ถ้ายังไม่ได้ login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/cart")
    }
  }, [status, router])

  // Handle select/deselect group
  const handleSelectGroup = (groupId: string, selected: boolean) => {
    setSelectedGroups((prev) => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(groupId)
      } else {
        newSet.delete(groupId)
      }
      return newSet
    })
  }

  // Handle select all / deselect all
  const handleSelectAll = () => {
    if (selectedGroups.size === groupedItems.length) {
      // ถ้าเลือกหมดแล้ว → ยกเลิกทั้งหมด
      setSelectedGroups(new Set())
    } else {
      // เลือกทั้งหมด
      setSelectedGroups(new Set(groupedItems.map((g) => g.groupId)))
    }
  }

  // ใช้ ConfirmDialog แทน window.confirm ที่เป็นกล่องของระบบปฏิบัติการ
  // (โผล่มาสีขาวกลางเว็บพื้นเข้ม และสไตล์ไม่ได้เลย)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  // คำนวณสรุปจากกลุ่มที่เลือก
  const selectedGroupsList = groupedItems.filter((g) => selectedGroups.has(g.groupId))
  const selectedItemsCount = selectedGroupsList.length

  // จำนวนชิ้นทั้งหมด
  const selectedTotalQuantity = selectedGroupsList.reduce((sum, g) => {
    const mainQty = g.mainItem?.quantity || 0
    const pairedQty = g.pairedItems.reduce((s, p) => s + p.quantity, 0)
    return sum + mainQty + pairedQty
  }, 0)

  // จำนวนสินค้าหลัก
  const selectedMainQuantity = selectedGroupsList.reduce((sum, g) => {
    return sum + (g.mainItem?.quantity || 0)
  }, 0)

  // จำนวนสินค้าคู่
  const selectedPairedQuantity = selectedGroupsList.reduce((sum, g) => {
    return sum + g.pairedItems.reduce((s, p) => s + p.quantity, 0)
  }, 0)

  // Loading session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not authenticated
  if (status === "unauthenticated") {
    return null
  }

  const isAllSelected = selectedGroups.size === groupedItems.length && groupedItems.length > 0

  return (
    <>
      <Navbar currentPage="ตะกร้าสินค้า" />

      <div className="pt-16 min-h-screen bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">ตะกร้าสินค้า</h1>
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? "กำลังโหลด..."
                    : `${groupedItems.length} รายการ (${totalItems} ชิ้น)`}
                </p>
              </div>
            </div>

            <ConfirmDialog
              open={confirmClearOpen}
              onOpenChange={setConfirmClearOpen}
              title="ล้างตะกร้าทั้งหมด?"
              description="สินค้าทุกรายการในตะกร้าจะถูกนำออก การกระทำนี้ย้อนกลับไม่ได้"
              confirmLabel="ล้างตะกร้า"
              onConfirm={async () => {
                await clearCart()
              }}
            />

            {/* Clear Cart Button */}
            {items.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmClearOpen(true)}
                className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                ล้างตะกร้า
              </Button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">กำลังโหลดตะกร้าสินค้า...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && items.length === 0 && (
            <div className="bg-card rounded-2xl border border-border p-8 sm:p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                ตะกร้าของคุณว่างเปล่า
              </h2>
              <p className="text-muted-foreground mb-6">
                เริ่มเลือกสินค้าที่คุณต้องการจองได้เลย
              </p>
              <Link href="/">
                <Button className="bg-primary hover:bg-primary/90">
                  <Package className="w-5 h-5 mr-2" />
                  เลือกดูสินค้า
                </Button>
              </Link>
            </div>
          )}

          {/* Cart Content - 2 Columns Layout */}
          {!isLoading && items.length > 0 && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: Cart Items */}
              <div className="flex-1">
                {/* Select All Bar */}
                <div className="bg-card rounded-xl border border-border p-4 mb-4 flex items-center justify-between">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    {isAllSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </button>
                  <span className="text-sm text-muted-foreground">
                    เลือกแล้ว {selectedGroups.size} / {groupedItems.length} รายการ
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                  {groupedItems.map((group) => (
                    <CartItemCard
                      key={group.groupId}
                      group={group}
                      isSelected={selectedGroups.has(group.groupId)}
                      onSelectChange={handleSelectGroup}
                    />
                  ))}
                </div>
              </div>

              {/* Right: Summary - Sticky */}
              <div className="lg:w-80 xl:w-96">
                <div className="lg:sticky lg:top-24">
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-4">สรุปการจอง</h3>

                    {/* สรุปจำนวน */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-muted-foreground">
                        <span>รายการที่เลือก</span>
                        <span className="font-medium">{selectedItemsCount} รายการ</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>สินค้าหลัก</span>
                        <span className="font-medium">{selectedMainQuantity} ชิ้น</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>สินค้าคู่</span>
                        <span className="font-medium">{selectedPairedQuantity} ชิ้น</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="border-t border-border pt-4 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-foreground">
                          รวมทั้งหมด
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {selectedTotalQuantity} ชิ้น
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        * ระบบจองสินค้าไม่มีการชำระเงินออนไลน์
                      </p>
                    </div>

                    {/* Checkout Button */}
                    <Button
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-lg py-6 disabled:opacity-50"
                      disabled={selectedItemsCount === 0}
                      onClick={() => {
                        // ส่ง item IDs ทั้งหมดใน selected groups
                        const selectedIds = selectedGroupsList.flatMap((g) => {
                          const ids: string[] = []
                          if (g.mainItem) ids.push(g.mainItem.id)
                          g.pairedItems.forEach((p) => ids.push(p.id))
                          return ids
                        })
                        router.push(`/checkout?items=${selectedIds.join(",")}`)
                      }}
                    >
                      ดำเนินการจอง
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>

                    {/* Warning if nothing selected */}
                    {selectedItemsCount === 0 && (
                      <p className="text-center text-sm text-warning mt-3">
                        กรุณาเลือกอย่างน้อย 1 รายการ
                      </p>
                    )}

                    {/* Continue Shopping */}
                    <div className="text-center mt-4">
                      <Link
                        href="/"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        ← เลือกสินค้าเพิ่มเติม
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}
