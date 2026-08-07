"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProductsTable } from "@/features/products/components/admin/products-table"
import { ProductsSearch } from "@/features/products/components/admin/products-search"
import { DataPagination } from "@/components/ui/data-pagination"
import { ProductFormModal } from "@/features/products/components/admin/product-form-modal"
import { DeleteProductDialog } from "@/features/products/components/admin/delete-product-dialog"
import { ExclusivePairingModal } from "@/features/products/components/admin/exclusive-pairing-modal"
import { Plus, Package, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  subtitle: string | null
  slug: string
  description: string | null
  image: string | null
  images: string[]
  datasheets: any | null
  isActive: boolean
  categoryId: string
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    slug: string
  }
  _count: {
    orderItems: number
  }
}

function ProductsTableSkeleton() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="bg-background px-4 py-3 border-b border-border flex gap-4">
        <div className="w-16 h-4 bg-card rounded animate-pulse" />
        <div className="flex-1 h-4 bg-card rounded animate-pulse" />
        <div className="w-24 h-4 bg-card rounded animate-pulse" />
        <div className="w-20 h-4 bg-card rounded animate-pulse" />
        <div className="w-16 h-4 bg-card rounded animate-pulse" />
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border">
          <div className="w-16 h-16 bg-card rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-card rounded w-48 animate-pulse" />
            <div className="h-3 bg-card rounded w-32 animate-pulse" />
          </div>
          <div className="w-24 h-6 bg-card rounded animate-pulse" />
          <div className="w-16 h-6 bg-card rounded-full animate-pulse" />
          <div className="w-8 h-8 bg-card rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [, setTotal] = useState(0)

  const [exclusiveModalOpen, setExclusiveModalOpen] = useState(false)
  const [selectedProductForExclusive, setSelectedProductForExclusive] =
    useState<Product | null>(null)
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  })

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories?limit=100")
      const data = await response.json()
      if (response.ok) {
        setCategories(data.categories.filter((c: any) => c.isActive))
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search,
        categoryId: categoryFilter === "all" ? "" : categoryFilter,
        status: statusFilter === "all" ? "" : statusFilter,
        page: page.toString(),
        limit: "10",
      })

      const response = await fetch(`/api/admin/products?${params}`)
      const data = await response.json()

      if (response.ok) {
        setProducts(data.products)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)

        if (data.stats) {
          setStats({
            total: data.stats.total,
            active: data.stats.active,
            inactive: data.stats.inactive,
          })
        }
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [search, categoryFilter, statusFilter, page])

  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryFilter(newCategoryId)
    setPage(1)
  }

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    setPage(1)
  }

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    setPage(1)
  }

  const handleAdd = () => {
    setSelectedProduct(null)
    setIsFormOpen(true)
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setIsFormOpen(true)
  }

  const handleDelete = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteOpen(true)
  }

  const handleSuccess = () => {
    fetchProducts()
  }

  const handleExclusivePairing = (product: Product) => {
    setSelectedProductForExclusive(product)
    setExclusiveModalOpen(true)
  }

  const handleToggleStatus = async (product: Product) => {
    setTogglingId(product.id)
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      })

      if (response.ok) {
        toast.success(
          product.isActive
            ? `ปิดใช้งาน "${product.name}" แล้ว`
            : `เปิดใช้งาน "${product.name}" แล้ว`
        )
        fetchProducts()
      } else {
        const data = await response.json()
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error toggling product status:", error)
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ")
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการสินค้า</h1>
          <p className="text-muted-foreground mt-1">จัดการข้อมูลสินค้าทั้งหมดในระบบ</p>
        </div>
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มสินค้าใหม่
        </Button>
      </div>

      {/* Stats Cards - คลิกได้เพื่อ filter ตามสถานะ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className={cn(
            "bg-background border-border cursor-pointer transition-all hover:border-info/50",
            statusFilter === "all" && "ring-2 ring-info border-info/40"
          )}
          onClick={() => handleStatusChange("all")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">สินค้าทั้งหมด</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "bg-background border-border cursor-pointer transition-all hover:border-success/50",
            statusFilter === "active" && "ring-2 ring-success border-success/40"
          )}
          onClick={() => handleStatusChange("active")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">เปิดใช้งาน</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "bg-background border-border cursor-pointer transition-all hover:border-destructive/50",
            statusFilter === "inactive" && "ring-2 ring-destructive border-destructive/40"
          )}
          onClick={() => handleStatusChange("inactive")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">ปิดใช้งาน</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.inactive}</p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="bg-background border-border">
        <CardHeader className="border-b border-border">
          <ProductsSearch
            onSearchChange={handleSearchChange}
            onCategoryChange={handleCategoryChange}
            onStatusChange={handleStatusChange}
            categories={categories}
            defaultSearch={search}
            defaultCategory={categoryFilter}
            defaultStatus={statusFilter}
          />
        </CardHeader>
      </Card>

      {/* Products Table */}
      <Card className="bg-background border-border">
        <CardContent className="p-0">
          {loading ? (
            <ProductsTableSkeleton />
          ) : (
            <>
              <ProductsTable
                products={products}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onExclusivePairing={handleExclusivePairing}
                onToggleStatus={handleToggleStatus}
                isDeleting={isDeleting}
                togglingId={togglingId}
              />
              {totalPages > 1 && (
                <div className="border-t border-border p-4">
                  <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ProductFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleSuccess}
        product={selectedProduct}
        categories={categories}
      />

      <DeleteProductDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={handleSuccess}
        product={selectedProduct}
        onDeleteStart={() => setIsDeleting(true)}
        onDeleteEnd={() => setIsDeleting(false)}
      />

      <ExclusivePairingModal
        open={exclusiveModalOpen}
        onOpenChange={setExclusiveModalOpen}
        product={selectedProductForExclusive}
        onSuccess={() => fetchProducts()}
      />
    </div>
  )
}
