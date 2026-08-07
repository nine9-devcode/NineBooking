// app/admin/(dashboard)/quotations/page.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
  QuotationsTable,
  QuotationsStats,
  QuotationsFilters,
  QuotationPreview,
  QuotationStats,
} from "@/features/quotations/components"
import { DataPagination } from "@/components/ui/data-pagination"

const DEFAULT_STATS: QuotationStats = {
  total: 0,
  DRAFT: 0,
  SENT: 0,
  ACCEPTED: 0,
  REJECTED: 0,
  EXPIRED: 0,
}

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationPreview[]>([])
  const [stats, setStats] = useState<QuotationStats>(DEFAULT_STATS)
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchQuotations = useCallback(
    async (isRefresh = false) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        })

        if (search) params.set("search", search)
        if (statusFilter !== "all") params.set("status", statusFilter)
        if (dateFrom) params.set("dateFrom", dateFrom)
        if (dateTo) params.set("dateTo", dateTo)

        const res = await fetch(`/api/admin/quotations?${params}`)
        const data = await res.json()

        if (res.ok) {
          setQuotations(data.quotations || [])
          setStats(data.stats || DEFAULT_STATS)
          setPagination((prev) => ({
            ...prev,
            total: data.pagination?.total || 0,
            totalPages: data.pagination?.totalPages || 0,
          }))

          if (isRefresh) toast.success("รีเฟรชข้อมูลสำเร็จ")
        } else {
          toast.error(data.error || "เกิดข้อผิดพลาดในการดึงข้อมูล")
        }
      } catch (err) {
        toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล")
      } finally {
        setLoading(false)
      }
    },
    [pagination.page, pagination.limit, search, statusFilter, dateFrom, dateTo]
  )

  useEffect(() => {
    fetchQuotations()
  }, [fetchQuotations])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [search, statusFilter, dateFrom, dateTo])

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/quotations/${deleteId}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (res.ok) {
        toast.success("ลบใบเสนอราคาเรียบร้อยแล้ว")
        setDeleteId(null)
        fetchQuotations()
      } else {
        toast.error(data.error || "ไม่สามารถลบได้")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ใบเสนอราคา</h1>
          <p className="text-muted-foreground mt-2">จัดการใบเสนอราคาทั้งหมด</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchQuotations(true)}
          disabled={loading}
          className="border-border text-foreground hover:bg-card hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          รีเฟรช
        </Button>
      </div>

      {/* Stats */}
      <QuotationsStats
        stats={stats}
        loading={loading}
        activeFilter={statusFilter}
        onFilterChange={(val) => {
          setStatusFilter(val)
          setPagination((prev) => ({ ...prev, page: 1 }))
        }}
      />

      {/* Filters */}
      <QuotationsFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        limit={pagination.limit}
        onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
      />

      {/* Table */}
      <QuotationsTable
        quotations={quotations}
        loading={loading}
        emptyMessage={
          search || statusFilter !== "all" || dateFrom || dateTo
            ? "ไม่พบใบเสนอราคาที่ตรงกับเงื่อนไข"
            : undefined
        }
        onDelete={(id) => setDeleteId(id)}
      />

      {/* Pagination */}
      <DataPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        pageSize={pagination.limit}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              ยืนยันการลบใบเสนอราคา?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              การลบจะไม่สามารถกู้คืนได้ คุณต้องการดำเนินการต่อหรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-foreground border-border hover:bg-secondary">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive"
            >
              {deleting ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
