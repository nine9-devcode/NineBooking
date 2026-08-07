"use client"

import { useState, useEffect } from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Type สำหรับเก็บทั้ง File และ URL (กรณี edit)
export interface ImageValue {
  file?: File
  url?: string
  preview: string
}

interface ImageUploadProps {
  value: ImageValue | null
  onChange: (value: ImageValue | null) => void
  existingUrl?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  existingUrl,
  disabled = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>("")

  // Set initial preview from existingUrl
  useEffect(() => {
    if (existingUrl && !value) {
      onChange({
        url: existingUrl,
        preview: existingUrl,
      })
    }
  }, [existingUrl])

  // Update preview when value changes
  useEffect(() => {
    if (value?.preview) {
      setPreview(value.preview)
    } else {
      setPreview("")
    }
  }, [value])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพ")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ใหญ่เกินไป (สูงสุด 5MB)")
      return
    }

    // Create local preview URL
    const localPreview = URL.createObjectURL(file)

    onChange({
      file: file,
      preview: localPreview,
    })

    // Reset input
    e.target.value = ""
  }

  const handleRemove = () => {
    // Revoke old blob URL
    if (value?.preview && value.preview.startsWith("blob:")) {
      URL.revokeObjectURL(value.preview)
    }
    onChange(null)
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative w-full h-64 bg-card rounded-lg overflow-hidden border-2 border-border">
          <Image
            src={preview}
            alt="Uploaded image"
            fill
            className="object-contain"
            unoptimized={preview.startsWith("blob:")}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </Button>
          {/* Badge for new image */}
          {value?.file && (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-warning text-warning-foreground text-xs rounded">
              รูปใหม่ (ยังไม่บันทึก)
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
          />
          <div className="w-full h-64 bg-card rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center hover:border-border transition-colors">
            <Upload className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-1">คลิกเพื่อเลือกรูปภาพ</p>
            <p className="text-muted-foreground text-sm">PNG, JPG, GIF, WebP (สูงสุด 5MB)</p>
          </div>
        </div>
      )}
    </div>
  )
}

// อัปโหลดรูปผ่าน /api/upload/image
export async function uploadImage(imageValue: ImageValue): Promise<string> {
  // If existing URL (no file), return as-is
  if (!imageValue.file && imageValue.url) {
    return imageValue.url
  }

  if (!imageValue.file) {
    throw new Error("No file to upload")
  }

  const formData = new FormData()
  formData.append("file", imageValue.file)

  const response = await fetch("/api/upload/image", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Upload failed")
  }

  const data = await response.json()
  return data.url
}
