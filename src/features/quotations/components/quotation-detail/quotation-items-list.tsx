// components/admin/quotations/quotation-detail/quotation-items-list.tsx

"use client"

import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Package, Link2 } from "lucide-react"
import { GroupedQuotationItem } from "./quotation-types"
import { formatCurrency } from "../constants"

interface QuotationItemsListProps {
  groupedItems: GroupedQuotationItem[]
  totalItems: number
  onItemPriceChange: (tempId: string, value: number) => void
  readOnly?: boolean
}

export function QuotationItemsList({
  groupedItems,
  totalItems,
  onItemPriceChange,
  readOnly = false,
}: QuotationItemsListProps) {
  // คำนวณ breakdown
  const mainQuantity = groupedItems.reduce((sum, g) => sum + g.main.quantity, 0)
  const pairedQuantity = groupedItems.reduce(
    (sum, g) => sum + g.paired.reduce((ps, p) => ps + p.quantity, 0),
    0
  )

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
            {groupedItems.length} กลุ่ม • {totalItems} รายการ
          </div>
        </div>
        {/* Breakdown */}
        <div className="flex items-center gap-4 mt-2 text-xs">
          <span className="text-muted-foreground">
            สินค้าหลัก: <span className="text-primary font-medium">{mainQuantity} ชิ้น</span>
          </span>
          {pairedQuantity > 0 && (
            <span className="text-muted-foreground">
              สินค้าคู่: <span className="text-warning font-medium">{pairedQuantity} ชิ้น</span>
            </span>
          )}
        </div>
      </div>

      {/* Table Header + Items — scrollable on mobile */}
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-card text-sm font-medium text-muted-foreground border-b border-border">
            <div className="col-span-1">#</div>
            <div className="col-span-5">รายการ</div>
            <div className="col-span-2 text-center">จำนวน</div>
            <div className="col-span-2 text-right">ราคา/หน่วย</div>
            <div className="col-span-2 text-right">รวม</div>
          </div>

          {/* Items */}
          <div className="divide-y divide-border">
            {groupedItems.map((group, index) => (
              <div key={group.main.tempId} className="p-4 space-y-3">
                {/* Main Product */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 text-muted-foreground font-medium">
                    {index + 1}
                  </div>

                  <div className="col-span-5 flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                      {group.main.productImage ? (
                        <Image
                          src={group.main.productImage}
                          alt={group.main.productName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground font-medium truncate">
                        {group.main.productName}
                      </p>
                      {group.paired.length > 0 && (
                        <p className="text-xs text-primary mt-0.5">
                          + {group.paired.length} สินค้าคู่
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 text-center">
                    <span className="text-foreground font-semibold bg-secondary px-3 py-1 rounded">
                      {group.main.quantity}
                    </span>
                  </div>

                  <div className="col-span-2">
                    {readOnly ? (
                      <p className="text-foreground text-right font-medium">
                        {formatCurrency(group.main.unitPrice)}
                      </p>
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={group.main.unitPrice || ""}
                        onChange={(e) =>
                          onItemPriceChange(group.main.tempId, parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        className="bg-secondary border-border text-foreground text-right h-9"
                      />
                    )}
                  </div>

                  <div className="col-span-2 text-right">
                    <span className="text-foreground font-semibold">
                      {formatCurrency(group.main.quantity * group.main.unitPrice)}
                    </span>
                  </div>
                </div>

                {/* Paired Products */}
                {group.paired.length > 0 && (
                  <div className="ml-6 p-3 bg-warning/10 rounded-lg border border-warning/20 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="w-4 h-4 text-warning" />
                      <span className="text-sm font-medium text-warning">
                        สินค้าที่ใช้คู่กัน
                      </span>
                    </div>

                    {group.paired.map((paired) => (
                      <div
                        key={paired.tempId}
                        className="grid grid-cols-12 gap-2 items-center bg-card/50 rounded-lg p-2"
                      >
                        <div className="col-span-1">
                          <span className="text-warning text-xs">└─</span>
                        </div>

                        <div className="col-span-5 flex items-center gap-2">
                          <div className="relative w-10 h-10 bg-secondary rounded overflow-hidden flex-shrink-0">
                            {paired.productImage ? (
                              <Image
                                src={paired.productImage}
                                alt={paired.productName}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-warning text-sm truncate">
                              {paired.productName}
                            </p>
                            <span className="text-xs px-1.5 py-0.5 bg-warning/10 text-warning rounded">
                              สินค้าคู่
                            </span>
                          </div>
                        </div>

                        <div className="col-span-2 text-center">
                          <span className="text-warning font-semibold bg-warning/10 px-3 py-1 rounded">
                            {paired.quantity}
                          </span>
                        </div>

                        <div className="col-span-2">
                          {readOnly ? (
                            <p className="text-warning text-right font-medium">
                              {formatCurrency(paired.unitPrice)}
                            </p>
                          ) : (
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={paired.unitPrice || ""}
                              onChange={(e) =>
                                onItemPriceChange(
                                  paired.tempId,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0.00"
                              className="bg-secondary border-warning/30 text-warning text-right h-9"
                            />
                          )}
                        </div>

                        <div className="col-span-2 text-right">
                          <span className="text-warning font-semibold">
                            {formatCurrency(paired.quantity * paired.unitPrice)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* min-w */}
      </div>
      {/* overflow-x-auto */}
    </div>
  )
}
