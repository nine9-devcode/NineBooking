"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CategoriesTable } from "@/features/categories/components/admin/categories-table"
import { CategoriesSearch } from "@/features/categories/components/admin/categories-search"
import { DataPagination } from "@/components/ui/data-pagination"
import { CategoryFormModal } from "@/features/categories/components/admin/category-form-modal"
import { DeleteCategoryDialog } from "@/features/categories/components/admin/delete-category-dialog"
import { Plus, RefreshCw, FolderTree, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  parentId: string | null
  sortOrder: number
  parent?: {
    id: string
    name: string
    slug: string
    sortOrder: number
  } | null
  children?: Category[]
  _count: {
    products: number
    children: number
  }
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface StatsData {
  total: number
  active: number
  inactive: number
}

function CategoriesTableSkeleton() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="bg-background px-4 py-3 border-b border-border flex gap-4">
        <div className="w-20 h-4 bg-card rounded animate-pulse" />
        <div className="flex-1 h-4 bg-card rounded animate-pulse" />
        <div className="w-32 h-4 bg-card rounded animate-pulse" />
        <div className="w-16 h-4 bg-card rounded animate-pulse" />
        <div className="w-20 h-4 bg-card rounded animate-pulse" />
        <div className="w-24 h-4 bg-card rounded animate-pulse" />
        <div className="w-16 h-4 bg-card rounded animate-pulse" />
        <div className="w-20 h-4 bg-card rounded animate-pulse" />
        <div className="w-12 h-4 bg-card rounded animate-pulse" />
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border">
          <div className="w-20 h-8 bg-card rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-card rounded w-40 animate-pulse" />
            <div className="h-3 bg-card rounded w-28 animate-pulse" />
          </div>
          <div className="w-32 h-3 bg-card rounded animate-pulse" />
          <div className="w-16 h-6 bg-card rounded animate-pulse" />
          <div className="w-20 h-6 bg-card rounded animate-pulse" />
          <div className="w-24 h-6 bg-card rounded animate-pulse" />
          <div className="w-16 h-6 bg-card rounded-full animate-pulse" />
          <div className="w-20 h-4 bg-card rounded animate-pulse" />
          <div className="w-8 h-8 bg-card rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    active: 0,
    inactive: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  // ดึงข้อมูลหมวดหมู่
  const fetchCategories = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: "10",
        search,
        status: statusFilter === "all" ? "" : statusFilter,
        sortBy: "sortOrder",
        sortOrder: "asc",
      })

      const response = await fetch(`/api/admin/categories?${params}`)
      const data = await response.json()

      if (response.ok) {
        setCategories(data.categories)
        setPagination(data.pagination)
        if (data.stats) {
          setStats(data.stats)
        }
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาดในการดึงข้อมูล")
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [search, statusFilter, pagination.page])

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleRefresh = () => {
    fetchCategories()
    toast.success("รีเฟรชข้อมูลสำเร็จ")
  }

  const handleAdd = () => {
    setSelectedCategory(null)
    setFormModalOpen(true)
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setFormModalOpen(true)
  }

  const handleDelete = (category: Category) => {
    setSelectedCategory(category)
    setDeleteDialogOpen(true)
  }

  const handleSuccess = () => {
    fetchCategories()
  }

  const handleToggleStatus = async (category: Category) => {
    setTogglingId(category.id)
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !category.isActive }),
      })

      if (response.ok) {
        toast.success(
          category.isActive
            ? `ปิดใช้งาน "${category.name}" แล้ว`
            : `เปิดใช้งาน "${category.name}" แล้ว`
        )
        fetchCategories()
      } else {
        const data = await response.json()
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error toggling category status:", error)
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ")
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการหมวดหมู่</h1>
          <p className="text-muted-foreground mt-2">
            จัดการหมวดหมู่สินค้าทั้งหมดในระบบ
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="border-border text-foreground hover:bg-card hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </Button>
          <Button
            onClick={handleAdd}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มหมวดหมู่
          </Button>
        </div>
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
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-primary" />
              <p className="text-sm text-muted-foreground font-medium">
                หมวดหมู่ทั้งหมด
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "bg-background border-border cursor-pointer transition-all hover:border-success/50",
            statusFilter === "active" && "ring-2 ring-success border-success/40"
          )}
          onClick={() => handleStatusChange("active")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <p className="text-sm text-muted-foreground font-medium">ใช้งาน</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{stats.active}</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "bg-background border-border cursor-pointer transition-all hover:border-destructive/50",
            statusFilter === "inactive" && "ring-2 ring-destructive border-destructive/40"
          )}
          onClick={() => handleStatusChange("inactive")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-muted-foreground font-medium">ปิดใช้งาน</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{stats.inactive}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="bg-background border-border">
        <CardHeader className="border-b border-border">
          <CategoriesSearch
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            defaultSearch={search}
            defaultStatus={statusFilter}
          />
        </CardHeader>
      </Card>

      {/* Table */}
      <Card className="bg-background border-border">
        <CardContent className="p-0">
          {loading ? (
            <CategoriesTableSkeleton />
          ) : (
            <>
              <CategoriesTable
                categories={categories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={fetchCategories}
                onToggleStatus={handleToggleStatus}
                togglingId={togglingId}
              />
              {pagination.totalPages > 1 && (
                <div className="border-t border-border p-4">
                  <DataPagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CategoryFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={handleSuccess}
        category={selectedCategory}
      />

      <DeleteCategoryDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={handleSuccess}
        category={selectedCategory}
      />
    </div>
  )
}
