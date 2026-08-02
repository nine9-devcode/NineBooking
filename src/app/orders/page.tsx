"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  OrderCard,
  OrderFilters,
  OrderEmptyState,
  OrderSearchBar,
  OrderPreview,
  PaginationState,
  OrderNotification,
} from "@/features/orders/components"
import { DataPagination } from "@/components/ui/data-pagination"

// Skeleton card for loading state
function OrderCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-4 sm:p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="h-4 w-36 bg-secondary rounded mb-2" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
        <div className="h-6 w-20 bg-secondary rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-secondary rounded-lg" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-secondary rounded mb-1" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-secondary rounded-lg" />
          <div className="flex-1">
            <div className="h-4 w-28 bg-secondary rounded mb-1" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

function OrdersPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { status: sessionStatus } = useSession()

  const [orders, setOrders] = useState<OrderPreview[]>([])
  const [loading, setLoading] = useState(true)

  // Initialize state from URL params
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  )
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  )
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">(
    (searchParams.get("sort") as "desc" | "asc") || "desc"
  )
  const [pagination, setPagination] = useState<PaginationState>({
    page: parseInt(searchParams.get("page") || "1"),
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Notification state
  const [unreadOrderIds, setUnreadOrderIds] = useState<Set<string>>(new Set())

  // Helper: update URL params
  const updateURL = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([k, v]) => {
        // Remove default values from URL
        if (
          !v ||
          (k === "status" && v === "all") ||
          (k === "sort" && v === "desc") ||
          (k === "page" && v === "1")
        ) {
          params.delete(k)
        } else {
          params.set(k, v)
        }
      })
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
    },
    [searchParams, pathname, router]
  )

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPagination((p) => ({ ...p, page: 1 }))
      updateURL({ search: searchQuery, page: "1" })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort: sortOrder,
      })

      if (statusFilter !== "all") {
        params.set("status", statusFilter)
      }

      if (debouncedSearch) {
        params.set("search", debouncedSearch)
      }

      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()

      if (res.ok) {
        setOrders(data.orders)
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }))
      }
    } catch (err) {
      console.error("Error fetching orders:", err)
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล")
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, statusFilter, debouncedSearch, sortOrder])

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchOrders()
    }
  }, [sessionStatus, fetchOrders])

  // Auto-refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        sessionStatus === "authenticated"
      ) {
        fetchOrders()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [sessionStatus, fetchOrders])

  // Fetch notifications (unread)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/user/order-notifications?type=list")
        if (res.ok) {
          const data = await res.json()
          const unreadIds = new Set<string>(
            data.notifications
              .filter((n: OrderNotification) => !n.isRead)
              .map((n: OrderNotification) => n.orderId)
          )
          setUnreadOrderIds(unreadIds)
        }
      } catch (err) {
        console.error("Error fetching notifications:", err)
      }
    }

    if (sessionStatus === "authenticated") {
      fetchNotifications()
    }
  }, [sessionStatus])

  // Redirect ถ้ายังไม่ได้ login
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/orders")
    }
  }, [sessionStatus, router])

  // Handlers
  const handleFilterChange = (status: string) => {
    setStatusFilter(status)
    setPagination((p) => ({ ...p, page: 1 }))
    updateURL({ status, page: "1" })
  }

  const handleSortChange = (value: "desc" | "asc") => {
    setSortOrder(value)
    setPagination((p) => ({ ...p, page: 1 }))
    updateURL({ sort: value, page: "1" })
  }

  const handlePageChange = (page: number) => {
    setPagination((p) => ({ ...p, page }))
    updateURL({ page: page.toString() })
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setDebouncedSearch("")
    setPagination((p) => ({ ...p, page: 1 }))
    updateURL({ search: "", page: "1" })
  }

  // Loading session
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (sessionStatus === "unauthenticated") {
    return null
  }

  return (
    <>
      <Navbar currentPage="ประวัติการจอง" />

      <div className="pt-16 min-h-screen bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">ประวัติการจอง</h1>
                <p className="text-sm text-muted-foreground">
                  {pagination.total} รายการทั้งหมด
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <OrderSearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
          />

          {/* Filter + Sort */}
          <OrderFilters
            statusFilter={statusFilter}
            onFilterChange={handleFilterChange}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && orders.length === 0 && (
            <OrderEmptyState
              statusFilter={statusFilter}
              searchQuery={debouncedSearch}
              onClearSearch={handleClearSearch}
            />
          )}

          {/* Orders List */}
          {!loading && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  hasNotification={unreadOrderIds.has(order.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && (
            <DataPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={pagination.limit}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <OrdersPageContent />
    </Suspense>
  )
}
