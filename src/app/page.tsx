"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ProductsSearch, SortOption } from "@/features/products/components/products-search"
import { ProductGrid } from "@/features/products/components/product-grid"
import { DataPagination } from "@/components/ui/data-pagination"
import { AlertTriangle, RefreshCw } from "lucide-react"
import type { Product } from "@/features/products/types"

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

function HomePageContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // อ่านค่าจาก URL
  const categorySlugFromUrl = searchParams.get("category")
  const pageFromUrl = parseInt(searchParams.get("page") || "1")
  const sortFromUrl = (searchParams.get("sort") as SortOption) || "category"
  const searchFromUrl = searchParams.get("q") || ""

  // สถานะต่างๆ
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: pageFromUrl,
    limit: 12,
    total: 0,
    totalPages: 0,
  })
  const [initialLoading, setInitialLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState<string>("สินค้าทั้งหมด")

  // ดึงสินค้า
  useEffect(() => {
    if (status !== "authenticated") return

    const abortController = new AbortController()

    const fetchProducts = async () => {
      try {
        setIsFetching(true)
        setError(null)

        const params = new URLSearchParams({
          page: pageFromUrl.toString(),
          limit: "12",
          sort: sortFromUrl,
        })

        if (searchFromUrl) {
          params.set("search", searchFromUrl)
        }

        if (categorySlugFromUrl) {
          params.set("categorySlug", categorySlugFromUrl)
        }

        const res = await fetch(`/api/products?${params}`, {
          signal: abortController.signal,
        })

        if (!res.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูลสินค้าได้")
        }

        const data = await res.json()

        setProducts(data.products || [])
        setPagination({
          page: pageFromUrl,
          limit: 12,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        })

        if (data.categoryInfo) {
          setSelectedCategoryId(data.categoryInfo.id)
          setCategoryName(data.categoryInfo.name)
        } else {
          setSelectedCategoryId(null)
          setCategoryName("สินค้าทั้งหมด")
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        console.error("ดึงสินค้าล้มเหลว:", err)
        setError("เกิดข้อผิดพลาดในการโหลดสินค้า กรุณาลองใหม่อีกครั้ง")
      } finally {
        setInitialLoading(false)
        setIsFetching(false)
      }
    }

    fetchProducts()

    return () => abortController.abort()
  }, [status, pageFromUrl, sortFromUrl, searchFromUrl, categorySlugFromUrl])

  // Helper: สร้าง URL ใหม่
  const buildUrl = useCallback(
    (params: {
      category?: string | null
      page?: number
      sort?: SortOption
      search?: string
    }) => {
      const urlParams = new URLSearchParams()
      const category = params.category !== undefined ? params.category : categorySlugFromUrl
      const page = params.page !== undefined ? params.page : pageFromUrl
      const sort = params.sort !== undefined ? params.sort : sortFromUrl
      const search = params.search !== undefined ? params.search : searchFromUrl

      if (category) urlParams.set("category", category)
      if (page > 1) urlParams.set("page", page.toString())
      if (sort && sort !== "category") urlParams.set("sort", sort)
      if (search) urlParams.set("q", search)

      const queryString = urlParams.toString()
      return queryString ? `/?${queryString}` : "/"
    },
    [categorySlugFromUrl, pageFromUrl, sortFromUrl, searchFromUrl]
  )

  // เลือกหมวดหมู่ (จาก Sidebar)
  const handleSelectCategory = useCallback(
    (categoryId: string | null, name?: string, slug?: string) => {
      router.push(buildUrl({ category: slug || null, page: 1 }))
    },
    [router, buildUrl]
  )

  // เปลี่ยนหน้า
  const handlePageChange = useCallback(
    (page: number) => {
      router.push(buildUrl({ page }), { scroll: false })
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    [router, buildUrl]
  )

  // ค้นหา
  const handleSearchChange = useCallback(
    (value: string) => {
      router.push(buildUrl({ search: value, page: 1 }), { scroll: false })
    },
    [router, buildUrl]
  )

  // เปลี่ยนการเรียงลำดับ
  const handleSortChange = useCallback(
    (value: SortOption) => {
      router.push(buildUrl({ sort: value, page: 1 }), { scroll: false })
    },
    [router, buildUrl]
  )

  // ลองโหลดใหม่
  const handleRetry = useCallback(() => {
    setError(null)
    setInitialLoading(true)
    // บังคับ re-fetch ผ่าน router
    router.refresh()
  }, [router])

  // กำลังโหลด session
  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        role="status"
        aria-label="กำลังโหลด"
      >
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar selectedCategoryId={selectedCategoryId} onSelectCategory={handleSelectCategory} />

      <div className="lg:ml-64 pt-16 flex-1">
        <main className="bg-muted p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {/* ส่วนหัว */}
            <div className="mb-6">
              <div className="flex flex-col gap-4">
                {/* ชื่อหมวด + จำนวน */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {categoryName}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      พบ <span className="font-semibold text-primary">{pagination.total}</span>{" "}
                      รายการ
                    </p>
                  </div>
                </div>

                {/* ค้นหา + เรียงลำดับ */}
                <ProductsSearch
                  searchValue={searchFromUrl}
                  onSearchChange={handleSearchChange}
                  sortValue={sortFromUrl}
                  onSortChange={handleSortChange}
                />
              </div>
            </div>

            {/* แสดงข้อผิดพลาด */}
            {error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">เกิดข้อผิดพลาด</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">{error}</p>
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  ลองใหม่
                </button>
              </div>
            ) : (
              <div
                className={isFetching && !initialLoading ? "opacity-60 transition-opacity" : ""}
              >
                <ProductGrid products={products} loading={initialLoading} />
              </div>
            )}

            {!initialLoading && !error && pagination.totalPages > 1 && (
              <div className="mt-8">
                <DataPagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </main>
      </div>
      {/* ส่วนท้าย */}
      <Footer hasSidebar={true} />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          role="status"
          aria-label="กำลังโหลด"
        >
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  )
}
