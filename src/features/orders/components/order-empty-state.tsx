"use client"

import Link from "next/link"
import { Package, Search, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { STATUS_CONFIG, OrderStatusKey } from "./constants"

interface OrderEmptyStateProps {
  statusFilter: string
  searchQuery?: string
  onClearSearch?: () => void
}

export function OrderEmptyState({
  statusFilter,
  searchQuery,
  onClearSearch,
}: OrderEmptyStateProps) {
  const statusLabel =
    statusFilter !== "all" ? STATUS_CONFIG[statusFilter as OrderStatusKey]?.label : null

  // Search empty state
  if (searchQuery) {
    return (
      <div className="text-center py-20">
        <Search className="w-16 h-16 text-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          ไม่พบการจองที่ตรงกับ &ldquo;{searchQuery}&rdquo;
        </h2>
        <p className="text-muted-foreground mb-6">
          ลองค้นหาด้วยเลขที่ใบจอง เช่น ORD-20260224-001
        </p>
        {onClearSearch && (
          <Button variant="outline" onClick={onClearSearch}>
            ล้างการค้นหา
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="text-center py-20">
      <Package className="w-16 h-16 text-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        {statusFilter === "all" ? "ยังไม่มีรายการจอง" : `ไม่มีรายการ "${statusLabel}"`}
      </h2>
      <p className="text-muted-foreground mb-6">
        {statusFilter === "all" ? "เริ่มเลือกสินค้าและทำการจองได้เลย" : "ลองเลือกดูสถานะอื่น"}
      </p>
      {statusFilter === "all" && (
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90">
            <ShoppingBag className="w-4 h-4 mr-2" />
            เลือกดูสินค้า
          </Button>
        </Link>
      )}
    </div>
  )
}
