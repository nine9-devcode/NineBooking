"use client"

import { ImageIcon, AlertTriangle } from "lucide-react"
// Note: เมื่อย้ายไปใช้งานจริง ให้เปลี่ยน path ตามโครงสร้างโปรเจกต์
import { ImageUpload } from "@/features/products/components/admin/shared/image-upload"
import { GalleryUpload } from "@/features/products/components/admin/shared/gallery-upload"
import type { ImagesTabProps } from "./types"

export function ImagesTab({
  mainImage,
  onMainImageChange,
  galleryImages,
  onGalleryChange,
  loading,
}: ImagesTabProps) {
  return (
    <div className="space-y-6 p-1">
      {/* รูปหลัก */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">รูปหลัก</h3>
          <span className="text-destructive">*</span>
        </div>

        <div className="bg-card/50 rounded-xl p-4 border border-border">
          <ImageUpload value={mainImage} onChange={onMainImageChange} disabled={loading} />
        </div>

        <p className="text-sm text-muted-foreground">
          รูปภาพหลักที่จะแสดงในหน้าสินค้า (PNG, JPG, GIF, WebP สูงสุด 5MB)
        </p>

        {!mainImage && (
          <p className="text-sm text-warning flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            กรุณาเลือกรูปหลักของสินค้า
          </p>
        )}
      </div>

      {/* รูปเพิ่มเติม (Gallery) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">รูปเพิ่มเติม (Gallery)</h3>
          <span className="text-muted-foreground text-xs font-normal">- ไม่บังคับ</span>
        </div>

        <div className="bg-card/50 rounded-xl p-4 border border-border">
          <GalleryUpload values={galleryImages} onChange={onGalleryChange} disabled={loading} />
        </div>

        <p className="text-sm text-muted-foreground">
          อัปโหลดรูปเพิ่มเติมได้สูงสุด 10 รูป เพื่อแสดงรายละเอียดสินค้า
        </p>
      </div>
    </div>
  )
}
