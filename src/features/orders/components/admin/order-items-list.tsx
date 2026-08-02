"use client"

import Link from "next/link"
import Image from "next/image"
import { Package, ExternalLink, LinkIcon } from "lucide-react"
import { GroupedOrderItem } from "./order-types"

interface OrderItemsListProps {
  items: GroupedOrderItem[]
  totalItems: number
  totalQuantity: number
  mainQuantity?: number
  pairedQuantity?: number
}

export function OrderItemsList({
  items,
  totalItems,
  totalQuantity,
  mainQuantity,
  pairedQuantity,
}: OrderItemsListProps) {
  return (
    <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card/80">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            รายการสินค้า
          </h2>
          <div className="text-sm text-muted-foreground">
            {totalItems} รายการ • {totalQuantity} ชิ้น
          </div>
        </div>
        {/* breakdown */}
        {(mainQuantity !== undefined || pairedQuantity !== undefined) && (
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="text-muted-foreground">
              สินค้าหลัก:{" "}
              <span className="text-primary font-medium">
                {mainQuantity || 0} ชิ้น
              </span>
            </span>
            {(pairedQuantity || 0) > 0 && (
              <span className="text-muted-foreground">
                สินค้าคู่:{" "}
                <span className="text-warning font-medium">
                  {pairedQuantity} ชิ้น
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="divide-y divide-border">
        {items.map((group) => (
          <div key={group.groupId} className="p-4 sm:p-6">
            {/* สินค้าหลัก */}
            <div className="flex gap-4">
              <div className="relative w-20 h-20 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                {group.product.image ? (
                  <Image
                    src={group.product.image}
                    alt={group.product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-foreground">
                      {group.product.name}
                    </h3>
                    {group.product.category && (
                      <span className="text-xs text-muted-foreground">
                        {group.product.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* จำนวนสินค้าหลัก */}
                <div className="mt-2">
                  <p className="text-sm text-foreground">
                    จำนวน:{" "}
                    <span className="font-semibold text-primary">
                      {group.mainQuantity} ชิ้น
                    </span>
                  </p>
                  {group.pairedItems.length > 0 && (
                    <p className="text-xs text-warning mt-0.5">
                      + สินค้าคู่ {group.pairedItems.length} รายการ
                    </p>
                  )}
                </div>

                {/* Status + Link */}
                <div className="flex items-center gap-2 mt-2">
                  {group.product.isActive ? (
                    <span className="text-xs px-2 py-0.5 bg-success/10 text-success rounded">
                      พร้อมจำหน่าย
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded">
                      ไม่พร้อมจำหน่าย
                    </span>
                  )}
                  {group.product.slug && group.product.isActive && (
                    <Link
                      href={`/products/${group.product.slug}`}
                      target="_blank"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      ดูสินค้า
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* สินค้าคู่ */}
            {group.pairedItems.length > 0 && (
              <div className="mt-4 p-4 bg-warning/10 rounded-lg border border-warning/20">
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium text-warning">
                    สินค้าที่ใช้คู่กัน
                  </span>
                </div>
                <div className="space-y-3">
                  {group.pairedItems.map((paired) => (
                    <div
                      key={paired.id}
                      className="flex items-center gap-3 bg-card/50 rounded-lg p-2"
                    >
                      <div className="relative w-12 h-12 bg-secondary rounded overflow-hidden flex-shrink-0">
                        {paired.pairedProduct.image ? (
                          <Image
                            src={paired.pairedProduct.image}
                            alt={paired.pairedProduct.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-warning truncate">
                          {paired.pairedProduct.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {paired.pairedProduct.isActive ? (
                            <span className="text-xs px-1.5 py-0.5 bg-success/10 text-success rounded">
                              พร้อมจำหน่าย
                            </span>
                          ) : (
                            <span className="text-xs px-1.5 py-0.5 bg-destructive/10 text-destructive rounded">
                              ไม่พร้อมจำหน่าย
                            </span>
                          )}
                        </div>
                      </div>
                      {/* จำนวนสินค้าคู่ */}
                      <span className="text-sm font-semibold text-warning bg-warning/10 px-2.5 py-1 rounded">
                        {paired.quantity} ชิ้น
                      </span>
                      {paired.pairedProduct.slug &&
                        paired.pairedProduct.isActive && (
                          <Link
                            href={`/products/${paired.pairedProduct.slug}`}
                            target="_blank"
                            className="p-1.5 hover:bg-warning/20 rounded transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-warning" />
                          </Link>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Summary */}
      <div className="px-6 py-4 border-t border-border bg-card/80">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">รวมทั้งหมด</span>
          <span className="text-lg font-bold text-foreground">
            {totalQuantity} ชิ้น
          </span>
        </div>
      </div>
    </div>
  )
}