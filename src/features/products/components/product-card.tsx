"use client"

import Image from "next/image"
import Link from "next/link"
import { Package } from "lucide-react"
import type { Product } from "@/features/products/types"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`}>
      <div className="group bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary hover:scale-[1.02] h-full flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-foreground" />
            </div>
          )}

          {/* Category Badge - แสดงเมื่อ hover */}
          <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground shadow-sm">
              {product.category.name}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Category Badge - แสดงปกติ */}
          <div className="mb-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/25">
              {product.category.name}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Subtitle */}
          {product.subtitle && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {product.subtitle}
            </p>
          )}

          {/* Spacer */}
          <div className="flex-1 min-h-[12px]" />

          {/* Button */}
          <div className="mt-3">
            <span className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium rounded-lg border-2 border-primary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              ดูรายละเอียด
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}