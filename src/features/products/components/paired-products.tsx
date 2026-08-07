"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Package, Check, ChevronRight, LinkIcon, ExternalLink, Plus, Minus } from "lucide-react"

interface PairedProduct {
  id: string
  name: string
  subtitle: string | null
  slug: string
  image: string | null
  category: {
    id: string
    name: string
    slug: string
  }
}

interface PairedCategory {
  id: string
  name: string
  slug: string
}

export interface SelectedPairedProduct {
  productId: string
  productName: string
  quantity: number
}

interface PairedProductsProps {
  pairedCategories: PairedCategory[]
  pairedProducts: PairedProduct[]
  selectedProducts: SelectedPairedProduct[]
  onSelectProducts: (products: SelectedPairedProduct[]) => void
}

export function PairedProducts({
  pairedCategories,
  pairedProducts,
  selectedProducts,
  onSelectProducts,
}: PairedProductsProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(
    pairedCategories[0]?.id || null
  )

  // กรองสินค้าตามหมวดที่เลือก
  const filteredProducts = activeCategory
    ? pairedProducts.filter((p) => p.category.id === activeCategory)
    : pairedProducts

  // นับจำนวนสินค้าเพื่อเลือก layout
  const productCount = filteredProducts.length

  // Adaptive Layout
  const getLayoutClass = () => {
    if (productCount <= 4) {
      return "grid grid-cols-2 sm:grid-cols-4 gap-3"
    } else if (productCount <= 8) {
      return "flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-warning/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-warning/80"
    } else {
      return "grid grid-rows-2 grid-flow-col gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-warning/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-warning/80"
    }
  }

  const getCardClass = () => {
    if (productCount <= 4) {
      return ""
    }
    return "w-[140px] sm:w-[160px] flex-shrink-0"
  }

  // Helper functions
  const isSelected = (productId: string) => {
    return selectedProducts.some((p) => p.productId === productId)
  }

  const getQuantity = (productId: string) => {
    return selectedProducts.find((p) => p.productId === productId)?.quantity || 0
  }

  // เลือก/ยกเลิกสินค้า
  const toggleProduct = (product: PairedProduct) => {
    if (isSelected(product.id)) {
      // ยกเลิกการเลือก
      onSelectProducts(selectedProducts.filter((p) => p.productId !== product.id))
    } else {
      // เลือกสินค้า (เริ่มต้น quantity = 1)
      onSelectProducts([
        ...selectedProducts,
        { productId: product.id, productName: product.name, quantity: 1 },
      ])
    }
  }

  // เพิ่ม/ลดจำนวน
  const updateQuantity = (productId: string, delta: number) => {
    onSelectProducts(
      selectedProducts.map((p) => {
        if (p.productId === productId) {
          const newQty = Math.max(1, p.quantity + delta)
          return { ...p, quantity: newQty }
        }
        return p
      })
    )
  }

  // นับจำนวนสินค้าที่เลือกทั้งหมด
  const totalSelectedItems = selectedProducts.reduce((sum, p) => sum + p.quantity, 0)

  if (pairedProducts.length === 0) {
    return null
  }

  return (
    <div className="bg-warning/10 border border-warning/40 rounded-xl p-4 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <LinkIcon className="w-5 h-5 text-warning" />
        <h3 className="font-semibold text-foreground">สินค้าที่ใช้คู่กัน</h3>
        <span className="text-sm text-muted-foreground">(เลือกได้หลายชิ้น - ไม่บังคับ)</span>
      </div>

      {/* Category Tabs */}
      {pairedCategories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {pairedCategories.map((category) => {
            // นับจำนวนที่เลือกในหมวดนี้
            const selectedInCategory = selectedProducts.filter((sp) => {
              const product = pairedProducts.find((p) => p.id === sp.productId)
              return product?.category.id === category.id
            }).length

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted border border-border"
                }`}
              >
                {category.name}
                {selectedInCategory > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-primary-foreground/20 rounded-full text-xs">
                    {selectedInCategory}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Scroll hint */}
      {productCount > 4 && (
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <ChevronRight className="w-3 h-3" /> เลื่อนเพื่อดูเพิ่มเติม
        </p>
      )}

      {/* Products - Adaptive Layout */}
      <div className={getLayoutClass()}>
        {filteredProducts.map((product) => {
          const selected = isSelected(product.id)
          const qty = getQuantity(product.id)

          return (
            <div
              key={product.id}
              className={`relative bg-card rounded-lg border-2 p-2 transition-all ${
                selected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-border"
              } ${getCardClass()}`}
            >
              {/* Info Icon - มุมบนขวา */}
              <Link
                href={`/products/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute top-1 right-1 z-20 w-7 h-7 bg-card/90 hover:bg-primary hover:text-primary-foreground rounded-full flex items-center justify-center shadow-sm border border-border hover:border-primary transition-all duration-200"
                title="ดูรายละเอียดสินค้า"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              {/* Clickable Area for Selection */}
              <button onClick={() => toggleProduct(product)} className="w-full text-left">
                {/* Selected Indicator */}
                {selected && (
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center z-10">
                    <Check className="w-4 h-4 text-foreground" />
                  </div>
                )}

                {/* Product Image */}
                <div className="aspect-square relative bg-muted rounded-md overflow-hidden mb-2">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-foreground" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <p className="text-sm font-medium text-foreground line-clamp-2">
                  {product.name}
                </p>
                {product.subtitle && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {product.subtitle}
                  </p>
                )}

                {/* Category Badge */}
                <span className="inline-block mt-2 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                  {product.category.name}
                </span>
              </button>

              {/* Quantity Controls - แสดงเมื่อเลือกแล้ว */}
              {selected && (
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-center w-full">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateQuantity(product.id, -1)
                        }}
                        disabled={qty <= 1}
                        className="w-4 h-4 flex items-center justify-center rounded bg-muted hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{qty}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateQuantity(product.id, 1)
                        }}
                        className="w-4 h-4 flex items-center justify-center rounded bg-muted hover:bg-secondary"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected Products Summary */}
      {selectedProducts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-warning/40">
          <p className="text-sm text-warning mb-2 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> เลือกสินค้าคู่แล้ว{" "}
            <strong>{selectedProducts.length}</strong> รายการ (รวม{" "}
            <strong>{totalSelectedItems}</strong> ชิ้น)
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map((sp) => (
              <span
                key={sp.productId}
                className="inline-flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning text-xs rounded-full"
              >
                {sp.productName} x{sp.quantity}
                <button
                  onClick={() => {
                    const product = pairedProducts.find((p) => p.id === sp.productId)
                    if (product) toggleProduct(product)
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* View All Link */}
      {pairedCategories.length > 0 && (
        <div className="mt-4 text-center">
          <Link
            href={`/?category=${pairedCategories.find((c) => c.id === activeCategory)?.slug || pairedCategories[0]?.slug}`}
            className="text-sm text-primary hover:underline"
          >
            ดูสินค้าทั้งหมดในหมวด{" "}
            {pairedCategories.find((c) => c.id === activeCategory)?.name ||
              pairedCategories[0]?.name}{" "}
            →
          </Link>
        </div>
      )}
    </div>
  )
}
