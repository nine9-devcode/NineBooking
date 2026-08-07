// components/admin/quotations/quotation-detail/quotation-preview-modal.tsx

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, Download, ExternalLink } from "lucide-react"

interface QuotationPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  quotationId: string
  quotationNumber: string
}

export function QuotationPreviewModal({
  isOpen,
  onClose,
  quotationId,
  quotationNumber,
}: QuotationPreviewModalProps) {
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch PDF when modal opens
  useEffect(() => {
    if (isOpen && !previewUrl) {
      loadPreview()
    }
  }, [isOpen])

  // Cleanup URL on close
  useEffect(() => {
    if (!isOpen && previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setError(null)
    }
  }, [isOpen])

  const loadPreview = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/quotations/${quotationId}/pdf`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
      } else {
        setError("ไม่สามารถโหลดตัวอย่างได้")
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการโหลด")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    window.open(`/api/admin/quotations/${quotationId}/pdf`, "_blank")
  }

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              ตัวอย่างใบเสนอราคา - {quotationNumber}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                disabled={!previewUrl}
                className="border-border text-foreground hover:bg-card hover:text-foreground"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                เปิดในแท็บใหม่
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="border-border text-foreground hover:bg-card hover:text-foreground"
              >
                <Download className="w-4 h-4 mr-1" />
                ดาวน์โหลด
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-card rounded-lg overflow-hidden" style={{ height: "75vh" }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">กำลังโหลดตัวอย่าง...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <FileText className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground">{error}</p>
              <Button
                onClick={loadPreview}
                variant="outline"
                className="border-border text-foreground hover:bg-card hover:text-foreground"
              >
                ลองใหม่
              </Button>
            </div>
          ) : previewUrl ? (
            <iframe src={previewUrl} className="w-full h-full border-0" title="PDF Preview" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              ไม่สามารถแสดงตัวอย่างได้
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
