// app/admin/(dashboard)/quotations/[id]/page.tsx

"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Loader2,
  ArrowLeft,
  Save,
  Download,
  Eye,
  Copy,
  Check,
  FileText,
  ExternalLink,
  Trash2,
  AlertTriangle,
  History,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  // Types
  QuotationDetail,
  QuotationStatus,
  QuotationItemFormData,
  // Helpers
  groupQuotationItems,
  calculateTotals,
  mapItemsToFormData,
  // Components
  QuotationStatusCard,
  QuotationItemsList,
  QuotationSummary,
  QuotationSettings,
  QuotationCustomerInfo,
  QuotationShippingInfo,
  QuotationTimeline,
  QuotationPreviewModal,
  DeleteQuotationDialog,
  // Utils
  formatDate,
  formatCurrency,
  getQuotationStatusConfig,
} from "@/features/quotations/components"

export default function QuotationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quotationId = params.id as string

  const [quotation, setQuotation] = useState<QuotationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  // Edit state
  const [items, setItems] = useState<QuotationItemFormData[]>([])
  const [includeVat, setIncludeVat] = useState(true)
  const [vatPercent, setVatPercent] = useState(7)
  const [validDays, setValidDays] = useState(15)
  const [notes, setNotes] = useState("")
  const [pdfNotes, setPdfNotes] = useState<string | null>(null)
  const [status, setStatus] = useState<QuotationStatus>("DRAFT")
  const [hasChanges, setHasChanges] = useState(false)

  // Modal state
  const [showPreview, setShowPreview] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Computed
  const isReadOnly = quotation ? !quotation.isLatest : false

  // Fetch quotation
  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await fetch(`/api/admin/quotations/${quotationId}`)
        if (!res.ok) {
          setError("ไม่พบใบเสนอราคา")
          return
        }
        const data = await res.json()
        const q = data.quotation

        setQuotation(q)
        setIncludeVat(q.includeVat)
        setVatPercent(q.vatPercent)
        setValidDays(q.validDays)
        setNotes(q.notes || "")
        setPdfNotes(q.pdfNotes ?? null)
        setStatus(q.status)
        setItems(mapItemsToFormData(q.items))
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล")
      } finally {
        setLoading(false)
      }
    }

    if (quotationId) fetchQuotation()
  }, [quotationId])

  // Track changes
  useEffect(() => {
    if (quotation) {
      const itemsChanged =
        JSON.stringify(items.map((i) => ({ unitPrice: i.unitPrice }))) !==
        JSON.stringify(quotation.items.map((i) => ({ unitPrice: i.unitPrice })))

      const changed =
        includeVat !== quotation.includeVat ||
        vatPercent !== quotation.vatPercent ||
        validDays !== quotation.validDays ||
        notes !== (quotation.notes || "") ||
        pdfNotes !== (quotation.pdfNotes ?? null) ||
        status !== quotation.status ||
        itemsChanged

      setHasChanges(changed)
    }
  }, [includeVat, vatPercent, validDays, notes, pdfNotes, status, items, quotation])

  // Calculate totals
  const totals = useMemo(
    () => calculateTotals(items, includeVat, vatPercent),
    [items, includeVat, vatPercent]
  )

  // Group items for display
  const groupedItems = useMemo(() => groupQuotationItems(items), [items])

  // Handlers
  const handleCopy = () => {
    if (quotation?.quotationNumber) {
      navigator.clipboard.writeText(quotation.quotationNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleItemPriceChange = (tempId: string, value: number) => {
    setItems((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, unitPrice: value } : item))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/quotations/${quotationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          includeVat,
          vatPercent,
          validDays,
          notes,
          pdfNotes,
          status,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "เกิดข้อผิดพลาด")
        return
      }

      // ถ้าสร้าง version ใหม่ → redirect ไปหน้าใหม่
      if (data.isNewVersion) {
        toast.success("ราคาเปลี่ยน — สร้างเวอร์ชันใหม่เรียบร้อยแล้ว")
        router.push(`/admin/quotations/${data.quotation.id}`)
        return
      }

      toast.success("บันทึกใบเสนอราคาเรียบร้อยแล้ว")
      setHasChanges(false)

      // Refresh data
      const refreshRes = await fetch(`/api/admin/quotations/${quotationId}`)
      const refreshData = await refreshRes.json()
      setQuotation(refreshData.quotation)
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    if (hasChanges) {
      toast.info("กรุณาบันทึกการเปลี่ยนแปลงก่อนดูตัวอย่าง")
      return
    }
    setShowPreview(true)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/quotations/${quotationId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("ลบใบเสนอราคาเรียบร้อยแล้ว")
        router.push("/admin/quotations")
      } else {
        const data = await res.json()
        toast.error(data.error || "ไม่สามารถลบได้")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error || !quotation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">
          {error || "ไม่พบใบเสนอราคา"}
        </h1>
        <Link href="/admin/quotations">
          <Button>กลับไปรายการ</Button>
        </Link>
      </div>
    )
  }

  // Latest version link for read-only banner
  const latestVersion = quotation.versions?.find((v) => v.isLatest)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/quotations"
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {quotation.quotationNumber}
              </h1>
              {!quotation.isLatest && (
                <span className="text-sm font-normal bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                  เวอร์ชันเก่า
                </span>
              )}
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-secondary rounded transition-colors"
                title="คัดลอก"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              สร้างเมื่อ {formatDate(quotation.createdAt, true)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Link to Order */}
          <Link href={`/admin/orders/${quotation.orderId}`}>
            <Button variant="outline" className="border-border text-foreground hover:bg-card">
              <ExternalLink className="w-4 h-4 mr-2" />
              ดูคำสั่งจอง
            </Button>
          </Link>

          {/* Preview */}
          <Button
            variant="outline"
            onClick={handlePreview}
            className="border-border text-foreground hover:bg-card"
          >
            <Eye className="w-4 h-4 mr-2" />
            ตัวอย่าง
          </Button>

          {/* Download */}
          <Button
            variant="outline"
            onClick={() => window.open(`/api/admin/quotations/${quotationId}/pdf`, "_blank")}
            className="border-border text-foreground hover:bg-card"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>

          {/* Delete — ซ่อนเมื่อ readOnly */}
          {!isReadOnly && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              ลบ
            </Button>
          )}

          {/* Save — ซ่อนเมื่อ readOnly */}
          {!isReadOnly && (
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึก
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Read-only Banner */}
      {isReadOnly && (
        <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-warning">
              นี่คือเวอร์ชันเก่า (V{quotation.version}) — ดูเพื่ออ้างอิงเท่านั้น
            </p>
            <p className="text-sm text-warning/70 mt-0.5">
              ไม่สามารถแก้ไขได้ กรุณาใช้เวอร์ชันล่าสุดเพื่อแก้ไข
            </p>
          </div>
          {latestVersion && (
            <Link href={`/admin/quotations/${latestVersion.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="border-warning/50 text-warning hover:bg-warning/10 whitespace-nowrap"
              >
                ดูเวอร์ชันล่าสุด
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <QuotationStatusCard
            currentStatus={quotation.status}
            newStatus={status}
            onStatusChange={setStatus}
            readOnly={isReadOnly}
          />

          {/* Items */}
          <QuotationItemsList
            groupedItems={groupedItems}
            totalItems={items.length}
            onItemPriceChange={handleItemPriceChange}
            readOnly={isReadOnly}
          />

          {/* Summary */}
          <QuotationSummary
            totals={totals}
            includeVat={includeVat}
            onIncludeVatChange={setIncludeVat}
            vatPercent={vatPercent}
            onVatPercentChange={setVatPercent}
            readOnly={isReadOnly}
          />

          {/* Settings */}
          <QuotationSettings
            validDays={validDays}
            onValidDaysChange={setValidDays}
            notes={notes}
            onNotesChange={setNotes}
            pdfNotes={pdfNotes}
            onPdfNotesChange={setPdfNotes}
            readOnly={isReadOnly}
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <QuotationCustomerInfo customer={quotation.customer} user={quotation.user} />

          {/* Shipping Info */}
          <QuotationShippingInfo shipping={quotation.shipping} />

          {/* Version History */}
          {quotation.versions && quotation.versions.length > 1 && (
            <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-card/80">
                <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <History className="w-4 h-4 text-primary" />
                  ประวัติเวอร์ชัน ({quotation.versions.length})
                </h2>
              </div>
              <div className="divide-y divide-border">
                {quotation.versions.map((v) => {
                  const isCurrentVersion = v.id === quotationId
                  const statusConfig = getQuotationStatusConfig(v.status)
                  return (
                    <div
                      key={v.id}
                      className={cn(
                        "p-4",
                        isCurrentVersion && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-medium text-foreground text-sm truncate">
                              {v.quotationNumber}
                            </p>
                            {v.isLatest && (
                              <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                ล่าสุด
                              </span>
                            )}
                            {isCurrentVersion && (
                              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                กำลังดู
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(v.createdAt)}
                          </p>
                          <p className="text-xs font-semibold text-primary mt-0.5">
                            {formatCurrency(v.totalAmount)} บาท
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                              statusConfig.darkColor
                            )}
                          >
                            {statusConfig.label}
                          </span>
                          {!isCurrentVersion && (
                            <Link href={`/admin/quotations/${v.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                              >
                                ดู
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          <QuotationTimeline
            createdAt={quotation.createdAt}
            updatedAt={quotation.updatedAt}
            validUntil={quotation.validUntil}
            createdByName={quotation.createdByName}
          />
        </div>
      </div>

      {/* Modals */}
      <QuotationPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        quotationId={quotationId}
        quotationNumber={quotation.quotationNumber}
      />

      <DeleteQuotationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        quotationNumber={quotation.quotationNumber}
        isDeleting={deleting}
      />
    </div>
  )
}
