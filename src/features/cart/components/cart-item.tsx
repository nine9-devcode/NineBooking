"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Package, Plus, Minus, Trash2, Loader2, LinkIcon, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useCart } from "@/features/cart/cart-context"
import type { CartItem as CartItemType } from "@/features/cart/cart"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

// Type สำหรับ Grouped Cart Item
export interface GroupedCartItem {
  groupId: string
  productId: string
  product: CartItemType["product"]
  // สินค้าหลัก
  mainItem: CartItemType | null
  // สินค้าคู่
  pairedItems: CartItemType[]
  createdAt: string
}

interface CartItemProps {
  group: GroupedCartItem
  isSelected: boolean
  onSelectChange: (groupId: string, selected: boolean) => void
}

export function CartItemCard({ group, isSelected, onSelectChange }: CartItemProps) {
  const { updateCartItem, removeFromCart } = useCart()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)

  // อัพเดทจำนวนของ item
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setIsUpdating(itemId)
    await updateCartItem(itemId, { quantity: newQuantity })
    setIsUpdating(null)
  }

  // ลบทั้ง group (สินค้าหลัก + คู่ทั้งหมด)
  const handleRemoveGroup = async () => {
    setIsRemoving(true)
    
    // ลบ main item
    if (group.mainItem) {
      await removeFromCart(group.mainItem.id)
    }
    // ลบ paired items
    await Promise.all(group.pairedItems.map((item) => removeFromCart(item.id)))
    
    setIsRemoving(false)
  }

  // ลบ paired product เดี่ยว
  const handleRemovePairedItem = async (itemId: string) => {
    setIsUpdating(itemId)
    await removeFromCart(itemId)
    setIsUpdating(null)
  }

  // คำนวณจำนวนรวม
  const mainQuantity = group.mainItem?.quantity || 0
  const pairedTotalQuantity = group.pairedItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalQuantity = mainQuantity + pairedTotalQuantity

  return (
    <div
      className={`bg-card rounded-xl border-2 transition-all ${
        isSelected ? "border-primary shadow-md" : "border-border"
      } ${isRemoving ? "opacity-50 pointer-events-none" : ""}`}
    >
      {/* Main Product Header */}
      <div className="p-4 flex gap-4">
        {/* Checkbox */}
        <div className="flex items-start pt-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectChange(group.groupId, checked as boolean)}
            className="w-5 h-5 border-2"
          />
        </div>

        {/* Product Image */}
        <Link href={`/products/${group.product.slug}`} className="flex-shrink-0">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-lg overflow-hidden">
            {group.product.image ? (
              <Image
                src={group.product.image}
                alt={group.product.name}
                fill
                className="object-cover hover:scale-105 transition-transform"
                sizes="(max-width: 640px) 80px, 96px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-foreground" />
              </div>
            )}
          </div>
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          {/* Category */}
          <span className="inline-block px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full mb-1">
            {group.product.category.name}
          </span>

          {/* Name */}
          <Link href={`/products/${group.product.slug}`}>
            <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
              {group.product.name}
            </h3>
          </Link>

          {/* Subtitle */}
          {group.product.subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {group.product.subtitle}
            </p>
          )}

          {/* Summary */}
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              รวม <span className="font-semibold text-primary">{totalQuantity}</span> ชิ้น
            </span>
            {group.pairedItems.length > 0 && (
              <span className="text-warning">
                • มี {group.pairedItems.length} สินค้าคู่
              </span>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={confirmRemoveOpen}
          onOpenChange={setConfirmRemoveOpen}
          title="ลบสินค้านี้ออกจากตะกร้า?"
          description="สินค้าหลักและสินค้าที่ใช้คู่กันทั้งหมดในรายการนี้จะถูกนำออก"
          confirmLabel="ลบออก"
          onConfirm={handleRemoveGroup}
        />

        {/* Remove Group Button */}
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmRemoveOpen(true)}
            disabled={isRemoving}
            aria-label="ลบสินค้านี้ออกจากตะกร้า"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            {isRemoving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* สินค้าหลัก */}
      {group.mainItem && (
        <div className="border-t border-border p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">จำนวนสินค้าหลัก:</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-border rounded-lg bg-card">
                <button
                  onClick={() => handleUpdateQuantity(group.mainItem!.id, group.mainItem!.quantity - 1)}
                  disabled={group.mainItem.quantity <= 1 || isUpdating === group.mainItem.id}
                  className="p-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">
                  {isUpdating === group.mainItem.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    group.mainItem.quantity
                  )}
                </span>
                <button
                  onClick={() => handleUpdateQuantity(group.mainItem!.id, group.mainItem!.quantity + 1)}
                  disabled={isUpdating === group.mainItem.id || group.mainItem.quantity >= 99}
                  className="p-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-muted-foreground text-sm">ชิ้น</span>
            </div>
          </div>
        </div>
      )}

      {/* รายการสินค้าคู่ */}
      {group.pairedItems.length > 0 && (
        <div className="border-t border-border bg-warning/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-warning">สินค้าที่ใช้คู่กัน</span>
          </div>

          <div className="space-y-2">
            {group.pairedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-card rounded-lg p-3 border border-warning/40"
              >
                {/* Paired Product Image */}
                {item.pairedProduct?.image ? (
                  <div className="relative w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.pairedProduct.image}
                      alt={item.pairedProduct.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-foreground" />
                  </div>
                )}

                {/* Paired Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.pairedProduct?.name}
                  </p>
                  {item.pairedProduct?.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.pairedProduct.subtitle}
                    </p>
                  )}
                </div>

                {/* Link to product */}
                {item.pairedProduct?.slug && (
                  <Link
                    href={`/products/${item.pairedProduct.slug}`}
                    target="_blank"
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                    title="ดูรายละเอียด"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </Link>
                )}

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 border border-border rounded-lg bg-card">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1 || isUpdating === item.id}
                    className="p-1.5 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-lg"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">
                    {isUpdating === item.id ? (
                      <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                    ) : (
                      item.quantity
                    )}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={isUpdating === item.id || item.quantity >= 99}
                    className="p-1.5 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-lg"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Remove single paired */}
                <button
                  onClick={() => handleRemovePairedItem(item.id)}
                  disabled={isUpdating === item.id}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                >
                  {isUpdating === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// จัดกลุ่มสินค้าในตะกร้าตาม product และเวลา
export function groupCartItems(items: CartItemType[]): GroupedCartItem[] {
  const GROUP_TIME_THRESHOLD = 5000 // 5 วินาที

  // Sort by createdAt
  const sortedItems = [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const groups: GroupedCartItem[] = []
  let currentGroup: GroupedCartItem | null = null

  for (const item of sortedItems) {
    const itemTime = new Date(item.createdAt).getTime()

    // ตรวจสอบว่าควรรวมกับ group ปัจจุบันหรือไม่
    const shouldJoinGroup =
      currentGroup &&
      currentGroup.productId === item.productId &&
      itemTime - new Date(currentGroup.createdAt).getTime() <= GROUP_TIME_THRESHOLD

    if (shouldJoinGroup && currentGroup) {
      // รวมเข้า group เดิม
      if (item.pairedProductId === null) {
        // เป็นสินค้าหลัก
        currentGroup.mainItem = item
      } else {
        // เป็นสินค้าคู่
        currentGroup.pairedItems.push(item)
      }
    } else {
      // สร้าง group ใหม่
      currentGroup = {
        groupId: `${item.productId}-${item.createdAt}`,
        productId: item.productId,
        product: item.product,
        mainItem: item.pairedProductId === null ? item : null,
        pairedItems: item.pairedProductId !== null ? [item] : [],
        createdAt: item.createdAt,
      }
      groups.push(currentGroup)
    }
  }

  // Sort groups by createdAt descending (ใหม่สุดอยู่บน)
  return groups.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}