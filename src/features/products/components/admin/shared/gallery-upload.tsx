"use client"

import { useState, useEffect } from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Type สำหรับเก็บทั้ง File และ URL
export interface GalleryItem {
  id: string
  file?: File
  url?: string
  preview: string
  isNew: boolean
}

interface GalleryUploadProps {
  values: GalleryItem[]
  onChange: (values: GalleryItem[]) => void
  existingUrls?: string[]
  maxImages?: number
  disabled?: boolean
}

export function GalleryUpload({
  values,
  onChange,
  existingUrls,
  maxImages = 10,
  disabled = false,
}: GalleryUploadProps) {
  // Set initial values from existingUrls
  useEffect(() => {
    if (existingUrls && existingUrls.length > 0 && values.length === 0) {
      const initialItems: GalleryItem[] = existingUrls.map((url, index) => ({
        id: `existing-${index}-${Date.now()}`,
        url: url,
        preview: url,
        isNew: false,
      }))
      onChange(initialItems)
    }
  }, [existingUrls])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Check total count
    if (values.length + files.length > maxImages) {
      toast.error(`อัปโหลดได้สูงสุด ${maxImages} รูป`)
      return
    }

    const newItems: GalleryItem[] = []

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} ไม่ใช่ไฟล์รูปภาพ`)
        return
      }

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} ขนาดใหญ่เกินไป (สูงสุด 5MB)`)
        return
      }

      // Create local preview URL
      const localPreview = URL.createObjectURL(file)

      newItems.push({
        id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: file,
        preview: localPreview,
        isNew: true,
      })
    })

    if (newItems.length > 0) {
      onChange([...values, ...newItems])
      toast.success(`เลือก ${newItems.length} รูป (ยังไม่บันทึก)`)
    }

    // Reset input
    e.target.value = ""
  }

  const handleRemove = (id: string) => {
    const itemToRemove = values.find((item) => item.id === id)

    // Revoke blob URL
    if (itemToRemove?.preview.startsWith("blob:")) {
      URL.revokeObjectURL(itemToRemove.preview)
    }

    const newValues = values.filter((item) => item.id !== id)
    onChange(newValues)
  }

  // Count new and existing images
  const newCount = values.filter((v) => v.isNew).length
  const existingCount = values.filter((v) => !v.isNew).length

  return (
    <div className="space-y-4">
      {/* Preview Grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {values.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square bg-card rounded-lg overflow-hidden border border-border group"
            >
              <Image
                src={item.preview}
                alt="Gallery image"
                fill
                className="object-cover"
                unoptimized={item.preview.startsWith("blob:")}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 w-7 h-7"
                onClick={() => handleRemove(item.id)}
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </Button>
              {/* Badge for new image */}
              {item.isNew && (
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-warning text-foreground text-[10px] rounded">
                  ใหม่
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {values.length < maxImages && (
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
          />
          <div className="w-full h-28 bg-card rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center hover:border-border transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm mb-1">คลิกเพื่อเลือกรูปภาพ (หลายรูป)</p>
            <p className="text-muted-foreground text-xs">
              {values.length}/{maxImages} รูป (สูงสุด 5MB/รูป)
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      {values.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {existingCount > 0 && <span>รูปเดิม: {existingCount}</span>}
          {newCount > 0 && (
            <span className="text-warning">
              รูปใหม่: {newCount} (ยังไม่บันทึก)
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// อัปโหลดรูปแกลเลอรีผ่าน /api/upload/image
export async function uploadGallery(
  items: GalleryItem[]
): Promise<string[]> {
  const uploadPromises = items.map(async (item) => {
    // If existing URL (no file), return as-is
    if (!item.file && item.url) {
      return item.url
    }

    if (!item.file) {
      return null
    }

    const formData = new FormData()
    formData.append("file", item.file)

    const response = await fetch("/api/upload/image", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed for ${item.file.name}`)
    }

    const data = await response.json()
    return data.url
  })

  const results = await Promise.all(uploadPromises)
  return results.filter((url): url is string => url !== null)
}