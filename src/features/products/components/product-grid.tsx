"use client"

import { ProductCard } from "./product-card"
import { Package } from "lucide-react"
import type { Product } from "@/features/products/types"

interface ProductGridProps {
  products: Product[]
  loading?: boolean
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="aspect-square bg-secondary" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-secondary rounded w-16" />
        <div className="h-5 bg-secondary rounded w-3/4" />
        <div className="h-4 bg-secondary rounded w-1/2" />
        <div className="h-10 bg-secondary rounded w-full mt-4" />
      </div>
    </div>
  )
}

export function ProductGrid({ products, loading }: ProductGridProps) {
  // Loading State - Skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="status" aria-label="กำลังโหลดสินค้า">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  // Empty State
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Package className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          ไม่พบสินค้า
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          ไม่พบสินค้าที่ตรงกับการค้นหาของคุณ ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น
        </p>
      </div>
    )
  }

  // Products Grid
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
