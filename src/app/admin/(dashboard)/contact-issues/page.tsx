// app/admin/(dashboard)/contact-issues/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import ContactIssuesStats from "@/features/support/components/admin/contact-issues-stats"
import ContactIssuesTable from "@/features/support/components/admin/contact-issues-table"
import ContactIssuesSearch from "@/features/support/components/admin/contact-issues-search"
import { toast } from "sonner"
import { RefreshCw, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { getErrorMessage } from "@/lib/utils"

interface IssueStats {
  total: number
  pending: number
  inProgress: number
  closed: number
}

export default function ContactIssuesPage() {
  // Data State
  const [issues, setIssues] = useState([])
  const [stats, setStats] = useState<IssueStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    closed: 0,
  })
  const [loading, setLoading] = useState(true)
  
  // Filter & Pagination State
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [category, setCategory] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  // Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Fetch Issues List
  const fetchIssues = useCallback(async (isRefresh = false) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search,
        status,
        page: page.toString(),
        limit: limit.toString(),
      })

      // Add category filter if present
      if (category) params.set("category", category)
      // Add date filters if present
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const response = await fetch(`/api/admin/contact-issues?${params}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "เกิดข้อผิดพลาด")

      setIssues(data.issues)
      setTotalPages(data.pagination.totalPages)
      
      // Update stats
      if (data.stats) {
        setStats(data.stats)
      }

      if (isRefresh) {
        toast.success("รีเฟรชข้อมูลสำเร็จ")
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [search, status, category, dateFrom, dateTo, page])

  useEffect(() => {
    fetchIssues()
  }, [fetchIssues])

  // Handle Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("กรุณาเลือกรายการที่ต้องการลบ")
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch("/api/admin/contact-issues/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาด")
      }

      toast.success(`ลบ ${data.count} รายการสำเร็จ`)
      setSelectedIds([])
      setShowDeleteDialog(false)
      fetchIssues() // Refresh
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle Refresh
  const handleRefresh = () => {
    setSelectedIds([]) // Clear selection on refresh
    fetchIssues(true)
  }

  // Handle Select All
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(issues.map((issue: any) => issue.id))
    } else {
      setSelectedIds([])
    }
  }

  return (
    <div className="flex-col">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">
              จัดการแจ้งปัญหา
            </h1>
            <p className="text-sm text-muted-foreground">
              ดูและจัดการรายการแจ้งปัญหาจากลูกค้า ตอบกลับและอัปเดตสถานะ
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="border-border text-foreground hover:bg-card hover:text-foreground w-fit"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>

        {/* Stats Cards */}
        <ContactIssuesStats
          stats={stats}
          loading={false}
          activeStatus={status}
          onStatusChange={(val) => { setStatus(val); setPage(1) }}
        />

        {/* Search & Filter */}
        <ContactIssuesSearch
          currentStatus={status}
          onSearch={(value: string) => {
            setSearch(value)
            setPage(1)
          }}
          onStatusChange={(value: string) => {
            setStatus(value)
            setPage(1)
          }}
          onCategoryChange={(value: string) => {
            setCategory(value)
            setPage(1)
          }}
          dateFrom={dateFrom}
          onDateFromChange={(value: string) => {
            setDateFrom(value)
            setPage(1)
          }}
          dateTo={dateTo}
          onDateToChange={(value: string) => {
            setDateTo(value)
            setPage(1)
          }}
        />

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedIds.length === issues.length && issues.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="border-primary data-[state=checked]:bg-primary"
                />
                <span className="text-foreground font-medium">
                  เลือกแล้ว {selectedIds.length} รายการ
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                  className="border-border text-foreground hover:bg-card hover:text-foreground"
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  className="bg-destructive hover:bg-destructive text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  ลบ {selectedIds.length} รายการ
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Table with Loading State */}
        <Card className="bg-background border-border">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <ContactIssuesTable
                data={issues}
                isLoading={false}
                page={page}
                totalPages={totalPages}
                onPageChange={(p: number) => setPage(p)}
                onRefresh={fetchIssues}
                selectedIds={selectedIds}
                onSelectIds={setSelectedIds}
                isBulkDeleting={isDeleting}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              ยืนยันการลบรายการ
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              คุณแน่ใจหรือไม่ว่าต้องการลบ {selectedIds.length} รายการที่เลือก?
              <br />
              การกระทำนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-card text-foreground hover:bg-secondary border-border"
              disabled={isDeleting}
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  ลบทั้งหมด
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}