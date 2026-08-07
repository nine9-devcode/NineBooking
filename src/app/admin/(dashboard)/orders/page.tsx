"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { RefreshCw, Package, Clock, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { OrdersFilters, OrdersTable } from "@/features/orders/components/admin"
import { ExportButtons } from "@/features/dashboard/components/export-buttons"
import { DataPagination } from "@/components/ui/data-pagination"

interface OrderPreview {
  id: string
  orderNumber: string
  status: string
  customer: {
    id: string
    name: string
    email: string
    phone: string
    image: string | null
    nickname?: string | null
    memberType?: string | null
    memberTypeNote?: string | null
    userDeleted?: boolean
  }
  itemCount: number
  totalQuantity: number
  previewItems: {
    productName: string
    productImage: string | null
    quantity: number
    pairedProducts?: {
      name: string
      image: string | null
      quantity: number
    }[]
  }[]
  createdAt: string
  updatedAt: string
}

interface Stats {
  total: number
  PENDING: number
  CONFIRMED: number
  COMPLETED: number
  CANCELLED: number
}

const DEFAULT_STATS: Stats = {
  total: 0,
  PENDING: 0,
  CONFIRMED: 0,
  COMPLETED: 0,
  CANCELLED: 0,
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderPreview[]>([])
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Build filter params for export
  const buildFilterParams = () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    return params.toString()
  }

  // Fetch orders
  const fetchOrders = useCallback(
    async (isRefresh = false) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        })

        if (search) {
          params.set("search", search)
        }

        if (statusFilter !== "all") {
          params.set("status", statusFilter)
        }

        if (dateFrom) {
          params.set("dateFrom", dateFrom)
        }

        if (dateTo) {
          params.set("dateTo", dateTo)
        }

        const res = await fetch(`/api/admin/orders?${params}`)
        const data = await res.json()

        if (res.ok) {
          setOrders(data.orders || [])
          setStats(data.stats || DEFAULT_STATS)
          setPagination((prev) => ({
            ...prev,
            total: data.pagination?.total || 0,
            totalPages: data.pagination?.totalPages || 0,
          }))

          if (isRefresh) {
            toast.success("รีเฟรชข้อมูลสำเร็จ")
          }
        } else {
          toast.error(data.error || "เกิดข้อผิดพลาดในการดึงข้อมูล")
        }
      } catch (err) {
        console.error("Error fetching orders:", err)
        toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล")
        setOrders([])
        setStats(DEFAULT_STATS)
      } finally {
        setLoading(false)
      }
    },
    [pagination.page, pagination.limit, search, statusFilter, dateFrom, dateTo]
  )

  // Initial fetch and on filter change
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination((p) => ({ ...p, page: 1 }))
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPagination((p) => ({ ...p, page: 1 }))
  }

  const handleLimitChange = (value: number) => {
    setPagination((p) => ({ ...p, limit: value, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination((p) => ({ ...p, page }))
  }

  const handleRefresh = () => {
    fetchOrders(true)
  }

  const handleDateFromChange = (value: string) => {
    setDateFrom(value)
    setPagination((p) => ({ ...p, page: 1 }))
  }

  const handleDateToChange = (value: string) => {
    setDateTo(value)
    setPagination((p) => ({ ...p, page: 1 }))
  }

  // Empty message
  const emptyMessage =
    search || statusFilter !== "all" || dateFrom || dateTo
      ? "ลองเปลี่ยนเงื่อนไขการค้นหา"
      : "ยังไม่มีคำสั่งจองในระบบ"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการคำสั่งจอง</h1>
          <p className="text-muted-foreground mt-2">ดูและจัดการคำสั่งจองทั้งหมด</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons
            baseUrl="/api/admin/orders"
            filterParams={buildFilterParams()}
            filePrefix="orders"
          />
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="border-border text-foreground hover:bg-card hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "ทั้งหมด",
            value: stats.total,
            icon: Package,
            filter: "all",
            hover: "hover:border-info/50",
            active: "ring-info border-info/40",
            iconBg: "bg-info/10",
            iconColor: "text-info",
          },
          {
            label: "รอดำเนินการ",
            value: stats.PENDING,
            icon: Clock,
            filter: "PENDING",
            hover: "hover:border-primary/50",
            active: "ring-primary border-primary/40",
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
          },
          {
            label: "ยืนยันแล้ว",
            value: stats.CONFIRMED,
            icon: CheckCircle,
            filter: "CONFIRMED",
            hover: "hover:border-info/50",
            active: "ring-info border-info/40",
            iconBg: "bg-info/10",
            iconColor: "text-info",
          },
          {
            label: "เสร็จสิ้น",
            value: stats.COMPLETED,
            icon: CheckCircle,
            filter: "COMPLETED",
            hover: "hover:border-success/50",
            active: "ring-success border-success/40",
            iconBg: "bg-success/10",
            iconColor: "text-success",
          },
          {
            label: "ยกเลิก",
            value: stats.CANCELLED,
            icon: XCircle,
            filter: "CANCELLED",
            hover: "hover:border-destructive/50",
            active: "ring-destructive border-destructive/40",
            iconBg: "bg-destructive/10",
            iconColor: "text-destructive",
          },
        ].map(({ label, value, icon: Icon, filter, hover, active, iconBg, iconColor }) => {
          const isActive = statusFilter === filter
          return (
            <Card
              key={filter}
              onClick={() => handleStatusFilterChange(filter)}
              className={`bg-background border-border cursor-pointer transition-all ${hover} ${isActive ? `ring-2 ${active}` : ""}`}
            >
              <CardHeader className="pb-2">
                <p className="text-sm text-muted-foreground">{label}</p>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <div className={`p-2 ${iconBg} rounded-lg`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters (รวม Date Filter แล้ว) */}
      <OrdersFilters
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        limit={pagination.limit}
        onLimitChange={handleLimitChange}
        dateFrom={dateFrom}
        onDateFromChange={handleDateFromChange}
        dateTo={dateTo}
        onDateToChange={handleDateToChange}
      />

      {/* Table */}
      <Card className="bg-background border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <OrdersTable orders={orders} loading={loading} emptyMessage={emptyMessage} />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && orders.length > 0 && (
        <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
          <DataPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pagination.limit}
            onPageChange={handlePageChange}
            className="m-0 p-4"
          />
        </div>
      )}
    </div>
  )
}
