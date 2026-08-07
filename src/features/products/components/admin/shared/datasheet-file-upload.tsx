"use client"

import { useState, useRef } from "react"
import { Upload, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  getFileIcon,
  getFileIconColor,
  formatFileSize,
  getFileValidationError,
  getAcceptString,
} from "@/lib/file-utils"

interface DatasheetFileUploadProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
  uploading?: boolean
  uploadProgress?: number
  selectedFile?: File | null
  onRemoveFile?: () => void
}

export function DatasheetFileUpload({
  onFileSelect,
  disabled = false,
  uploading = false,
  uploadProgress = 0,
  selectedFile = null,
  onRemoveFile,
}: DatasheetFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !uploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled || uploading) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
    e.target.value = ""
  }

  const handleFile = (file: File) => {
    setError(null)

    const validationError = getFileValidationError(file)
    if (validationError) {
      setError(validationError)
      return
    }

    onFileSelect(file)
  }

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }

  const handleRemove = () => {
    setError(null)
    if (onRemoveFile) {
      onRemoveFile()
    }
  }

  // Show preview if file selected or uploading
  if (selectedFile || uploading) {
    const fileExt = selectedFile ? `.${selectedFile.name.split(".").pop()}` : ""
    const FileIconComponent = getFileIcon(fileExt)
    const iconColor = getFileIconColor(fileExt)

    return (
      <div className="space-y-2">
        <div className="bg-background rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            {/* File Icon */}
            <div className={cn("flex-shrink-0", iconColor)}>
              <FileIconComponent className="w-8 h-8" />
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {selectedFile?.name || "กำลังอัปโหลด..."}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedFile ? formatFileSize(selectedFile.size) : ""}
              </p>
            </div>

            {/* Remove Button */}
            {!uploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">กำลังอัปโหลด...</span>
                <span className="text-primary">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-card rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Upload Zone
  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptString()}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled || uploading}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer",
          "flex flex-col items-center justify-center text-center",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-background hover:border-border",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload
          className={cn(
            "w-10 h-10 mb-3 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )}
        />

        <p className="text-sm text-muted-foreground mb-1">
          {isDragging ? "วางไฟล์ที่นี่" : "คลิกหรือลากไฟล์มาวาง"}
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, DOC, DOCX, XLS, XLSX (สูงสุด 15 MB)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1 text-destructive text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
