// ไฟล์: components/public/product-detail.tsx
// Client Component สำหรับแสดงรายละเอียดสินค้า

"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { ProductGallery } from "@/features/products/components/product-gallery"
import { ProductCard } from "@/features/products/components/product-card"
import { AddToCartButton } from "@/features/cart/components/add-to-cart-button"
import { PairedProducts, SelectedPairedProduct } from "@/features/products/components/paired-products"
import { Footer } from "@/components/layout/footer"
import DOMPurify from "dompurify"
import {
  ChevronRight,
  Loader2,
  Package,
  FileDown,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  File,
} from "lucide-react"

interface Datasheet {
  type: "url" | "file"
  name: string
  value: string
  fileType?: string
  fileSize?: number
  fileName?: string
}

interface Product {
  id: string
  name: string
  subtitle: string | null
  slug: string
  description: string | null
  image: string | null
  images: string[]
  datasheets: Datasheet[] | null
  category: {
    id: string
    name: string
    slug: string
    parent?: {
      id: string
      name: string
      slug: string
    } | null
  }
}

interface RelatedProduct {
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

interface ProductDetailProps {
  slug: string
}

export function ProductDetail({ slug }: ProductDetailProps) {
  const router = useRouter()
  const { status } = useSession()

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State สำหรับ Paired Products
  const [pairedCategories, setPairedCategories] = useState<PairedCategory[]>([])
  const [pairedProducts, setPairedProducts] = useState<PairedProduct[]>([])
  const [selectedPairedProducts, setSelectedPairedProducts] = useState<SelectedPairedProduct[]>([])

  // Ref เพื่อป้องกันการเรียก View API ซ้ำ
  const viewTrackedRef = useRef<string | null>(null)

  // Redirect ถ้ายังไม่ได้ login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return

      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/products/${slug}`)
        
        if (!res.ok) {
          if (res.status === 404) {
            setError("ไม่พบสินค้าที่ค้นหา")
          } else {
            setError("เกิดข้อผิดพลาดในการโหลดข้อมูล")
          }
          return
        }

        const data = await res.json()
        setProduct(data.product)
        setRelatedProducts(data.relatedProducts || [])
      } catch (err) {
        console.error("Error fetching product:", err)
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล")
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchProduct()
    }
  }, [slug, status])

  // track view - เรียกเมื่อโหลดสินค้าสำเร็จ
  useEffect(() => {
    const trackView = async () => {
      if (!product || viewTrackedRef.current === slug) return
      try {
        await fetch(`/api/products/${slug}/view`, {
          method: 'POST',
        })
        viewTrackedRef.current = slug
      } catch (err) {
        console.error("Error tracking view:", err)
      }
    }

    if (product && status === "authenticated") {
      trackView()
    }
  }, [product, slug, status])

  // Fetch paired products
  useEffect(() => {
    const fetchPairedProducts = async () => {
      if (!slug || !product) return

      try {
        const res = await fetch(`/api/products/${slug}/paired`)
        
        if (res.ok) {
          const data = await res.json()
          setPairedCategories(data.pairedCategories || [])
          setPairedProducts(data.pairedProducts || [])
        }
      } catch (err) {
        console.error("Error fetching paired products:", err)
      }
    }

    if (product) {
      fetchPairedProducts()
    }
  }, [slug, product])

  // Reset selected paired products เมื่อเปลี่ยนสินค้า
  useEffect(() => {
    setSelectedPairedProducts([])
  }, [slug])

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

  // Loading product
  if (loading) {
    return (
      <>
        <Navbar currentPage="รายละเอียดสินค้า" />
        <div className="pt-16 min-h-screen bg-muted flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">กำลังโหลดข้อมูลสินค้า...</p>
          </div>
        </div>
      </>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <>
        <Navbar currentPage="ไม่พบสินค้า" />
        <div className="pt-16 min-h-screen bg-muted flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {error || "ไม่พบสินค้า"}
            </h1>
            <p className="text-muted-foreground mb-6">
              สินค้าที่คุณค้นหาอาจถูกลบหรือไม่มีอยู่ในระบบ
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar currentPage={product.name} />

      <div className="pt-16 min-h-screen bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-6 overflow-x-auto whitespace-nowrap pb-2">
            <Link
              href="/"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              หน้าแรก
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

            {/* Parent Category */}
            {product.category.parent && (
              <>
                <Link
                  href={`/?category=${product.category.parent.slug}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {product.category.parent.name}
                </Link>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </>
            )}

            {/* Category */}
            <Link
              href={`/?category=${product.category.slug}`}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {product.category.name}
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

            {/* Product Name */}
            <span className="text-foreground font-medium truncate">
              {product.name}
            </span>
          </nav>

          {/* Product Content */}
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 p-4 sm:p-6 lg:p-8">
              {/* Left: Gallery */}
              <div>
                <ProductGallery
                  mainImage={product.image}
                  images={product.images}
                  productName={product.name}
                />
              </div>

              {/* Right: Details */}
              <div className="flex flex-col">
                {/* Category Badge */}
                <div className="mb-3">
                  <Link
                    href={`/?category=${product.category.slug}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-colors"
                  >
                    {product.category.name}
                  </Link>
                </div>

                {/* Product Name */}
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  {product.name}
                </h1>

                {/* Subtitle */}
                {product.subtitle && (
                  <p className="text-lg text-muted-foreground mb-4">
                    {product.subtitle}
                  </p>
                )}

                {/* Divider */}
                <div className="border-t border-border my-4" />

                {/* Description - render HTML */}
                {product.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-3">
                      รายละเอียดสินค้า
                    </h2>
                    <div 
                      className="product-description"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
                    />
                  </div>
                )}

                {/* Datasheet Links */}
                {product.datasheets && product.datasheets.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-3">
                      เอกสารและ Datasheet
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {product.datasheets.map((datasheet, index) => {
                        let Icon = FileDown
                        let iconColor = "text-primary"

                        if (datasheet.type === "file" && datasheet.fileType) {
                          const ext = datasheet.fileType.toLowerCase()
                          if (ext === "pdf") {
                            Icon = FileText
                            iconColor = "text-destructive"
                          } else if (ext === "doc" || ext === "docx") {
                            Icon = FileText
                            iconColor = "text-info"
                          } else if (ext === "xls" || ext === "xlsx") {
                            Icon = FileSpreadsheet
                            iconColor = "text-success"
                          } else {
                            Icon = File
                            iconColor = "text-muted-foreground"
                          }
                        }

                        return (
                          <a
                            key={index}
                            href={datasheet.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-muted hover:bg-secondary rounded-lg text-foreground hover:text-foreground transition-colors group"
                          >
                            <Icon className={`w-5 h-5 ${iconColor}`} />
                            <span className="font-medium">
                              {datasheet.type === "url" ? "เปิด" : "ดาวน์โหลด"}{" "}
                              {datasheet.name}
                            </span>
                            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Spacer */}
                <div className="flex-1 min-h-[20px]" />

                {/* Paired Products */}
                {pairedProducts.length > 0 && (
                  <PairedProducts
                    pairedCategories={pairedCategories}
                    pairedProducts={pairedProducts}
                    selectedProducts={selectedPairedProducts}
                    onSelectProducts={setSelectedPairedProducts}
                  />
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t border-border">
                  <AddToCartButton
                    productId={product.id}
                    productName={product.name}
                    pairedProducts={selectedPairedProducts}
                  />

                  <p className="text-center text-sm text-muted-foreground mt-3">
                    * ระบบจองสินค้าไม่มีการชำระเงินออนไลน์
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
                สินค้าที่เกี่ยวข้อง
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relProduct) => (
                  <ProductCard
                    key={relProduct.id}
                    product={relProduct}
                  />
                ))}
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