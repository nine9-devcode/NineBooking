// ไฟล์: components/admin/export-buttons.tsx
// Reusable Export Buttons Component

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ExportButtonsProps {
  // Base URL for export (e.g., '/api/admin/orders')
  baseUrl: string
  // Current filter params as URLSearchParams string
  filterParams?: string
  // File name prefix
  filePrefix?: string
  // Show PDF option
  showPdf?: boolean
  // Show Excel option
  showExcel?: boolean
  // Button size
  size?: "default" | "sm" | "lg" | "icon"
}

export function ExportButtons({
  baseUrl,
  filterParams = "",
  filePrefix = "export",
  showPdf = true,
  showExcel = true,
  size = "sm",
}: ExportButtonsProps) {
  const [loading, setLoading] = useState<"pdf" | "excel" | null>(null)

  const handleExport = async (type: "pdf" | "excel") => {
    setLoading(type)

    try {
      const endpoint = type === "pdf" ? `${baseUrl}/export-pdf` : `${baseUrl}/export`
      const url = filterParams ? `${endpoint}?${filterParams}` : endpoint

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Export failed")
      }

      // Get filename from header or generate one
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = `${filePrefix}-${new Date().toISOString().split("T")[0]}`

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) {
          filename = match[1]
        }
      } else {
        filename += type === "pdf" ? ".pdf" : ".xlsx"
      }

      // Download file
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success("ส่งออกสำเร็จ", {
        description: `ดาวน์โหลดไฟล์ ${filename} แล้ว`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast.error("เกิดข้อผิดพลาด", {
        description: "ไม่สามารถส่งออกไฟล์ได้",
      })
    } finally {
      setLoading(null)
    }
  }

  // If only one option, show simple button
  if (showPdf && !showExcel) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => handleExport("pdf")}
        disabled={loading !== null}
        className="border-border text-foreground hover:bg-card hover:text-foreground"
      >
        {loading === "pdf" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 mr-2" />
        )}
        ส่งออก PDF
      </Button>
    )
  }

  if (showExcel && !showPdf) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => handleExport("excel")}
        disabled={loading !== null}
        className="border-border text-foreground hover:bg-card hover:text-foreground"
      >
        {loading === "excel" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 mr-2" />
        )}
        ส่งออก Excel
      </Button>
    )
  }

  // Show dropdown with both options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={loading !== null}
          className="border-border text-foreground hover:bg-card hover:text-foreground"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          ส่งออก
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border-border">
        {showPdf && (
          <DropdownMenuItem
            onClick={() => handleExport("pdf")}
            disabled={loading !== null}
            className="text-foreground hover:bg-card hover:text-foreground cursor-pointer"
          >
            <FileText className="w-4 h-4 mr-2 text-destructive" />
            ส่งออก PDF
          </DropdownMenuItem>
        )}
        {showExcel && (
          <DropdownMenuItem
            onClick={() => handleExport("excel")}
            disabled={loading !== null}
            className="text-foreground hover:bg-card hover:text-foreground cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-success" />
            ส่งออก Excel
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Simple PDF button for single item export
interface ExportPdfButtonProps {
  url: string
  filename?: string
  size?: "default" | "sm" | "lg" | "icon"
  children?: React.ReactNode
}

export function ExportPdfButton({
  url,
  filename,
  size = "sm",
  children,
}: ExportPdfButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)

    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Export failed")
      }

      // Get filename from header or use provided
      const contentDisposition = response.headers.get("Content-Disposition")
      let finalFilename = filename || "export.pdf"

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) {
          finalFilename = match[1]
        }
      }

      // Download file
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = finalFilename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success("ส่งออกสำเร็จ", {
        description: `ดาวน์โหลดไฟล์ ${finalFilename} แล้ว`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast.error("เกิดข้อผิดพลาด", {
        description: "ไม่สามารถส่งออกไฟล์ได้",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleExport}
      disabled={loading}
      className="border-border text-foreground hover:bg-card hover:text-foreground"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileText className="w-4 h-4 mr-2" />
      )}
      {children || "ส่งออก PDF"}
    </Button>
  )
}
