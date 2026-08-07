"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Trash2,
  FileText,
  ExternalLink,
  AlertCircle,
  Link2,
  Upload,
  Copy,
  Check,
  Lightbulb,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { DatasheetFileUpload } from "./datasheet-file-upload"
import {
  getFileIcon,
  getFileIconColor,
  formatFileSize,
  getFileExtension,
} from "@/lib/file-utils"
import {
  DATASHEET_CONFIG,
  type DatasheetItem,
  type DatasheetJSON,
  type DatasheetType,
} from "@/features/products/datasheet.types"

interface DatasheetInputProps {
  values: DatasheetItem[]
  onChange: (values: DatasheetItem[]) => void
  disabled?: boolean
}

// Validate URL
function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

export function DatasheetInput({ values, onChange, disabled = false }: DatasheetInputProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Add new datasheet (default: URL)
  const handleAdd = () => {
    if (values.length >= DATASHEET_CONFIG.maxItems) {
      toast.error(`เพิ่มได้สูงสุด ${DATASHEET_CONFIG.maxItems} รายการ`)
      return
    }

    const newItem: DatasheetItem = {
      id: `ds-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      type: "url",
      value: "",
    }

    onChange([...values, newItem])
  }

  // Remove datasheet
  const handleRemove = (id: string) => {
    const item = values.find((v) => v.id === id)

    if (item?.uploading) {
      toast.error("กรุณารอให้อัปโหลดเสร็จก่อน")
      return
    }

    onChange(values.filter((item) => item.id !== id))

    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[id]
      return newErrors
    })
  }

  // Update datasheet name
  const handleNameChange = (id: string, name: string) => {
    onChange(values.map((item) => (item.id === id ? { ...item, name } : item)))
  }

  // Update URL value
  const handleUrlChange = (id: string, url: string) => {
    onChange(values.map((item) => (item.id === id ? { ...item, value: url } : item)))

    if (url && !isValidUrl(url)) {
      setErrors((prev) => ({
        ...prev,
        [id]: "URL ไม่ถูกต้อง",
      }))
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[id]
        return newErrors
      })
    }
  }

  // Change type (URL <-> File)
  const handleTypeChange = (id: string, type: DatasheetType) => {
    const item = values.find((v) => v.id === id)

    if (item?.uploading) {
      toast.error("กรุณารอให้อัปโหลดเสร็จก่อน")
      return
    }

    onChange(
      values.map((item) =>
        item.id === id
          ? {
              ...item,
              type,
              value: "",
              file: undefined,
              fileType: undefined,
              fileSize: undefined,
              fileName: undefined,
            }
          : item
      )
    )

    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[id]
      return newErrors
    })
  }

  // File selected (ยังไม่อัปโหลด)
  const handleFileSelect = (id: string, file: File) => {
    onChange(
      values.map((item) =>
        item.id === id
          ? {
              ...item,
              file: file,
              fileName: file.name,
              fileSize: file.size,
              fileType: getFileExtension(file.name),
              value: "",
            }
          : item
      )
    )
  }

  // Remove selected file (ก่อนอัปโหลด)
  const handleRemoveFile = (id: string) => {
    onChange(
      values.map((item) =>
        item.id === id
          ? {
              ...item,
              file: undefined,
              fileName: undefined,
              fileSize: undefined,
              fileType: undefined,
              value: "",
            }
          : item
      )
    )
  }

  // Copy URL to clipboard
  const handleCopyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      toast.success("คัดลอก URL แล้ว")
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      toast.error("ไม่สามารถคัดลอกได้")
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Datasheet Links</span>
          <span className="text-xs text-muted-foreground">
            ({values.length}/{DATASHEET_CONFIG.maxItems})
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || values.length >= DATASHEET_CONFIG.maxItems}
          className="border-border text-foreground hover:bg-card hover:text-foreground"
        >
          <Plus className="w-4 h-4 mr-1" />
          เพิ่ม Link
        </Button>
      </div>

      {/* Empty State */}
      {values.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">ยังไม่มี datasheet links</p>
          <p className="text-xs text-muted-foreground mt-1">
            คลิก &quot;เพิ่ม Link&quot; เพื่อเพิ่ม link ไปยัง datasheet
          </p>
        </div>
      )}

      {/* Datasheet Items */}
      <div className="space-y-3">
        {values.map((item, index) => {
          const FileIconComponent = item.fileType ? getFileIcon(`.${item.fileType}`) : FileText
          const iconColor = item.fileType
            ? getFileIconColor(`.${item.fileType}`)
            : "text-muted-foreground"

          return (
            <div
              key={item.id}
              className={cn(
                "group relative bg-card/50 rounded-lg border border-border p-4",
                "hover:border-border transition-colors",
                errors[item.id] && "border-destructive/50"
              )}
            >
              {/* Row number indicator */}
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 flex items-center">
                <div className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                </div>
              </div>

              <div className="ml-4 space-y-4">
                {/* Name Input */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    ชื่อไฟล์ (แสดงในปุ่มดาวน์โหลด)
                  </label>
                  <Input
                    value={item.name}
                    onChange={(e) => handleNameChange(item.id, e.target.value)}
                    placeholder="เช่น User Manual TH, Datasheet EN"
                    className="bg-background border-border text-foreground h-10"
                    disabled={disabled || item.uploading}
                  />
                </div>

                {/* Type Tabs */}
                <Tabs
                  value={item.type}
                  onValueChange={(value) => handleTypeChange(item.id, value as DatasheetType)}
                >
                  <TabsList className="grid w-full grid-cols-2 bg-background border border-border p-1 h-auto rounded-lg">
                    <TabsTrigger
                      value="url"
                      disabled={disabled || item.uploading}
                      className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-semibold text-foreground hover:text-primary-foreground transition-all py-2 rounded-md"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      URL
                    </TabsTrigger>

                    <TabsTrigger
                      value="file"
                      disabled={disabled || item.uploading}
                      className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-semibold text-foreground hover:text-primary-foreground transition-all py-2 rounded-md"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      File
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* URL Input */}
                {item.type === "url" && (
                  <div className="space-y-1">
                    <div className="relative">
                      <Input
                        value={item.value}
                        onChange={(e) => handleUrlChange(item.id, e.target.value)}
                        placeholder="https://example.com/datasheet.pdf"
                        className={cn(
                          "bg-background border-border text-foreground h-10 pr-20",
                          errors[item.id] && "border-destructive/40 focus:border-destructive/40"
                        )}
                        disabled={disabled}
                      />
                      {item.value && isValidUrl(item.value) && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <a
                            href={item.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="เปิด link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(item.id, item.value)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="คัดลอก URL"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* File Upload */}
                {item.type === "file" && (
                  <div>
                    {!item.value ? (
                      <DatasheetFileUpload
                        onFileSelect={(file) => handleFileSelect(item.id, file)}
                        disabled={disabled}
                        uploading={item.uploading}
                        uploadProgress={item.uploadProgress}
                        selectedFile={item.file}
                        onRemoveFile={() => handleRemoveFile(item.id)}
                      />
                    ) : (
                      // File uploaded successfully
                      <div className="bg-background rounded-lg border border-border p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("flex-shrink-0", iconColor)}>
                            <FileIconComponent className="w-8 h-8" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.fileName || "ไฟล์ที่อัปโหลด"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.fileSize ? formatFileSize(item.fileSize) : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={item.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title="เปิดไฟล์"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyUrl(item.id, item.value)}
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title="คัดลอก URL"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-4 h-4 text-success" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Error message */}
                {errors[item.id] && (
                  <div className="flex items-center gap-1 text-destructive text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors[item.id]}</span>
                  </div>
                )}
              </div>

              {/* Remove Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(item.id)}
                disabled={disabled || item.uploading}
                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )
        })}
      </div>

      {/* Help text */}
      {values.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <Lightbulb className="w-3 h-3 inline mr-1" />
          ใส่ link ไปยังไฟล์ datasheet, user manual, หรืออัปโหลดไฟล์โดยตรง
        </p>
      )}
    </div>
  )
}

// Helper function: Convert DatasheetItem[] to JSON for API
export function datasheetsToJson(items: DatasheetItem[]): DatasheetJSON[] | null {
  const validItems = items.filter((item) => {
    if (item.type === "url") {
      return item.name && item.value && isValidUrl(item.value)
    }
    if (item.type === "file") {
      return item.name && item.value
    }
    return false
  })

  if (validItems.length === 0) return null

  return validItems.map((item) => ({
    type: item.type,
    name: item.name,
    value: item.value,
    fileType: item.fileType,
    fileSize: item.fileSize,
    fileName: item.fileName,
  }))
}

// Helper function: Convert JSON to DatasheetItem[] for form
export function jsonToDatasheets(json: DatasheetJSON[] | null): DatasheetItem[] {
  if (!json || !Array.isArray(json)) return []

  return json.map((item, index) => ({
    id: `existing-${index}-${Date.now()}`,
    name: item.name || "",
    type: item.type || "url",
    value: item.value || "",
    fileType: item.fileType,
    fileSize: item.fileSize,
    fileName: item.fileName,
  }))
}
