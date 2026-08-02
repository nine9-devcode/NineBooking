// ไฟล์: components/orders/order-card.tsx

"use client"

import Link from "next/link"
import Image from "next/image"
import { Package, ChevronRight } from "lucide-react"
import { OrderPreview } from "./types"
import { getStatusConfig } from "./constants"

interface OrderCardProps {
  order: OrderPreview
  hasNotification?: boolean // มี notification ที่ยังไม่ได้อ่าน
}

export function OrderCard({ order, hasNotification = false }: OrderCardProps) {
  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all relative"
    >
      {/* จุดแดง Notification */}
      {hasNotification && (
        <div className="absolute -top-1.5 -right-1.5 z-10">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive"></span>
          </span>
        </div>
      )}

      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-foreground">{order.orderNumber}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        {/* Preview Items */}
        <div className="space-y-3 mb-3">
          {order.previewItems.map((item, index) => (
            <div key={index} className="p-3 bg-muted rounded-lg">
              {/* สินค้าหลัก */}
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  {item.productImage ? (
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.productName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    จำนวน:{" "}
                    <span className="font-semibold text-primary">
                      {item.quantity} ชิ้น
                    </span>
                  </p>
                  {item.pairedProducts.length > 0 && (
                    <p className="text-xs text-warning">
                      + สินค้าคู่ {item.pairedProducts.length} รายการ
                    </p>
                  )}
                </div>
              </div>

              {/* สินค้าคู่ */}
              {item.pairedProducts.length > 0 && (
                <div className="mt-2 ml-4 pl-3 border-l-2 border-warning/40 space-y-1">
                  {item.pairedProducts.map((paired, pIndex) => (
                    <div key={pIndex} className="flex items-center gap-2">
                      <div className="relative w-7 h-7 bg-warning/10 rounded overflow-hidden flex-shrink-0">
                        {paired.image ? (
                          <Image
                            src={paired.image}
                            alt={paired.name}
                            fill
                            className="object-cover"
                            sizes="28px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-3 h-3 text-warning" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-warning flex-1 truncate">
                        {paired.name}
                      </span>
                      <span className="text-xs font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                        {paired.quantity} ชิ้น
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* แสดงจำนวนที่เหลือ */}
          {order.itemCount > 3 && (
            <div className="text-center text-sm text-muted-foreground py-1">
              และอีก {order.itemCount - 3} รายการ
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            <span>{order.itemCount} รายการ</span>
            <span>•</span>
            <span>
              สินค้าหลัก{" "}
              <span className="font-medium text-primary">
                {order.mainQuantity || order.totalQuantity}
              </span>{" "}
              ชิ้น
            </span>
            {order.pairedQuantity > 0 && (
              <>
                <span>•</span>
                <span className="text-warning">คู่ {order.pairedQuantity} ชิ้น</span>
              </>
            )}
          </div>
          <span className="text-primary font-medium">ดูรายละเอียด →</span>
        </div>
      </div>
    </Link>
  )
}