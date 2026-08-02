//components/grouped-items-list.tsx
"use client"

import Image from "next/image"
import Link from "next/link"
import { Package, LinkIcon, ExternalLink } from "lucide-react"
import { GroupedItem } from "@/features/orders/group-items"

interface GroupedItemsListProps {
  items: GroupedItem[]
  showLinks?: boolean // แสดง link ไปหน้าสินค้า
  compact?: boolean // แบบกะทัดรัด สำหรับ checkout summary
}

export function GroupedItemsList({
  items,
  showLinks = false,
  compact = false,
}: GroupedItemsListProps) {
  if (compact) {
    return (
      <div className="space-y-3">
        {items.map((group) => (
          <div key={group.productId} className="p-3 bg-muted rounded-lg">
            {/* สินค้าหลัก */}
            <div className="flex gap-3">
              <div className="relative w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                {group.product.image ? (
                  <Image
                    src={group.product.image}
                    alt={group.product.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {group.product.name}
                </p>
                {/* จำนวนสินค้าหลัก */}
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-primary">
                    {group.mainQuantity || 1}
                  </span>{" "}
                  ชิ้น
                  {group.pairedItems.length > 0 && (
                    <span className="text-warning ml-2">
                      + {group.pairedItems.length} สินค้าคู่
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* สินค้าคู่ */}
            {group.pairedItems.length > 0 && (
              <div className="mt-2 pl-4 border-l-2 border-warning/40 space-y-1">
                {group.pairedItems.map((pair) => (
                  <div
                    key={pair.itemId}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-1 text-warning truncate">
                      <LinkIcon className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{pair.pairedProduct.name}</span>
                    </span>
                    <span className="text-warning font-medium ml-2 flex-shrink-0">
                      {pair.quantity} ชิ้น
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Full version
  return (
    <div className="divide-y divide-border">
      {items.map((group) => (
        <div key={group.productId} className="p-4 sm:p-6">
          {/* สินค้าหลัก */}
          <div className="flex gap-4">
            <div className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
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
                  <Package className="w-8 h-8 text-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-foreground">
                    {group.product.name}
                  </h3>
                  {/* จำนวนสินค้าหลัก */}
                  <div className="mt-1 space-y-0.5">
                    <p className="text-sm">
                      <span className="text-muted-foreground">จำนวน:</span>{" "}
                      <span className="font-semibold text-primary">
                        {group.mainQuantity || 1} ชิ้น
                      </span>
                    </p>
                    {group.pairedItems.length > 0 && (
                      <p className="text-xs text-warning">
                        + สินค้าคู่ {group.pairedItems.length} รายการ (
                        {group.pairedItems.reduce((sum, p) => sum + p.quantity, 0)} ชิ้น)
                      </p>
                    )}
                  </div>
                </div>
                {showLinks && group.product.slug && group.product.isActive && (
                  <Link
                    href={`/products/${group.product.slug}`}
                    target="_blank"
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="ดูสินค้า"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </Link>
                )}
              </div>

              {/* สินค้าคู่ */}
              {group.pairedItems.length > 0 && (
                <div className="mt-3 p-3 bg-warning/10 rounded-lg border border-warning/40">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium text-warning">
                      สินค้าที่ใช้คู่กัน
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.pairedItems.map((pair) => (
                      <div key={pair.itemId} className="flex items-center gap-3">
                        <div className="relative w-10 h-10 bg-card rounded overflow-hidden flex-shrink-0">
                          {pair.pairedProduct.image ? (
                            <Image
                              src={pair.pairedProduct.image}
                              alt={pair.pairedProduct.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-foreground" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-warning flex-1 truncate">
                          {pair.pairedProduct.name}
                        </span>
                        {/* จำนวน */}
                        <span className="text-sm text-warning font-semibold bg-warning/10 px-2 py-0.5 rounded">
                          {pair.quantity} ชิ้น
                        </span>
                        {showLinks &&
                          pair.pairedProduct.slug &&
                          pair.pairedProduct.isActive && (
                            <Link
                              href={`/products/${pair.pairedProduct.slug}`}
                              target="_blank"
                              className="p-1.5 hover:bg-warning/10 rounded transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-warning" />
                            </Link>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}