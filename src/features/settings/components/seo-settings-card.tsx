// ไฟล์: components/admin/settings/seo-settings-card.tsx
// Card สำหรับตั้งค่า SEO ในหน้า Settings

"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { 
  Loader2, 
  Save, 
  Search, 
  Image as ImageIcon, 
  Trash2, 
  ExternalLink,
  BarChart3,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/utils"

interface SeoSettings {
  id: string
  siteTitle: string
  siteDescription: string | null
  ogImage: string | null
  googleAnalyticsId: string | null
}

interface SeoSettingsCardProps {
  onSettingsChange?: () => void
}

export function SeoSettingsCard({ onSettingsChange }: SeoSettingsCardProps) {
  const [settings, setSettings] = useState<SeoSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    siteTitle: "",
    siteDescription: "",
    ogImage: "",
    googleAnalyticsId: "",
  })

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/seo-settings")
      
      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลการตั้งค่าได้")
      }

      const data = await response.json()
      setSettings(data.settings)
      setFormData({
        siteTitle: data.settings?.siteTitle || "NineBooking",
        siteDescription: data.settings?.siteDescription || "",
        ogImage: data.settings?.ogImage || "",
        googleAnalyticsId: data.settings?.googleAnalyticsId || "",
      })
      setHasChanges(false)
    } catch (error: unknown) {
      console.error("Error fetching SEO settings:", error)
      toast.error(getErrorMessage(error) || "เกิดข้อผิดพลาดในการดึงข้อมูล")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const response = await fetch("/api/admin/seo-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "ไม่สามารถบันทึกการตั้งค่าได้")
      }

      const data = await response.json()
      setSettings(data.settings)
      setHasChanges(false)
      toast.success("บันทึกการตั้งค่า SEO เรียบร้อยแล้ว")
      onSettingsChange?.()
    } catch (error: unknown) {
      console.error("Error saving SEO settings:", error)
      toast.error(getErrorMessage(error) || "เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (settings) {
      setFormData({
        siteTitle: settings.siteTitle || "NineBooking",
        siteDescription: settings.siteDescription || "",
        ogImage: settings.ogImage || "",
        googleAnalyticsId: settings.googleAnalyticsId || "",
      })
      setHasChanges(false)
    }
  }

  // Handle OG Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 5MB")
      return
    }

    try {
      setIsUploading(true)

      // สร้าง FormData
      const uploadData = new FormData()
      uploadData.append("file", file)
      uploadData.append("folder", "seo") // เก็บใน folder seo

      // อัปโหลดผ่าน API เดียวกับรูปสินค้า
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: uploadData,
      })

      if (!response.ok) {
        throw new Error("อัปโหลดรูปภาพไม่สำเร็จ")
      }

      const data = await response.json()
      
      // อัพเดท form
      setFormData(prev => ({ ...prev, ogImage: data.url }))
      setHasChanges(true)
      toast.success("อัปโหลดรูปภาพเรียบร้อยแล้ว")
    } catch (error: unknown) {
      console.error("Error uploading image:", error)
      toast.error(getErrorMessage(error) || "เกิดข้อผิดพลาดในการอัปโหลด")
    } finally {
      setIsUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Handle OG Image delete
  const handleImageDelete = async () => {
    if (!formData.ogImage) return

    try {
      setIsDeleting(true)

      const response = await fetch(
        `/api/admin/seo-settings?imageUrl=${encodeURIComponent(formData.ogImage)}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error("ลบรูปภาพไม่สำเร็จ")
      }

      // อัพเดท form
      setFormData(prev => ({ ...prev, ogImage: "" }))
      setHasChanges(true)
      toast.success("ลบรูปภาพเรียบร้อยแล้ว")
    } catch (error: unknown) {
      console.error("Error deleting image:", error)
      toast.error(getErrorMessage(error) || "เกิดข้อผิดพลาดในการลบ")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-background border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          การตั้งค่า SEO
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          ตั้งค่า Meta Tags, Open Graph และ Analytics สำหรับเว็บไซต์
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Site Title */}
        <div className="space-y-2">
          <Label htmlFor="siteTitle" className="text-foreground">
            ชื่อเว็บไซต์ <span className="text-destructive">*</span>
          </Label>
          <Input
            id="siteTitle"
            value={formData.siteTitle}
            onChange={(e) => handleInputChange("siteTitle", e.target.value)}
            placeholder="NineBooking"
            className="bg-card border-border text-foreground"
          />
          <p className="text-xs text-muted-foreground">
            แสดงใน Title Bar ของ Browser และผลการค้นหา Google
          </p>
        </div>

        {/* Site Description */}
        <div className="space-y-2">
          <Label htmlFor="siteDescription" className="text-foreground">
            คำอธิบายเว็บไซต์
          </Label>
          <Textarea
            id="siteDescription"
            value={formData.siteDescription}
            onChange={(e) => handleInputChange("siteDescription", e.target.value)}
            placeholder="ระบบจองสินค้าออนไลน์ พร้อมระบบหลังบ้านครบวงจร..."
            rows={3}
            className="bg-card border-border text-foreground resize-none"
          />
          <p className="text-xs text-muted-foreground">
            แสดงในผลการค้นหา Google และเมื่อ Share บน Social Media (แนะนำ 150-160 ตัวอักษร)
          </p>
        </div>

        {/* OG Image */}
        <div className="space-y-2">
          <Label className="text-foreground">
            รูปภาพ Open Graph
          </Label>
          
          {formData.ogImage ? (
            // แสดงรูปที่อัปโหลดแล้ว
            <div className="relative group">
              <div className="aspect-[1200/630] rounded-lg overflow-hidden border border-border bg-card">
                <img
                  src={formData.ogImage}
                  alt="OG Image Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Overlay buttons */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(formData.ogImage, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  ดูรูป
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleImageDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-1" />
                      ลบ
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Upload area
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[1200/630] rounded-lg border-2 border-dashed border-border bg-card/50 hover:bg-card hover:border-border transition-colors cursor-pointer flex flex-col items-center justify-center gap-3"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-muted-foreground">กำลังอัปโหลด...</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-foreground font-medium">คลิกเพื่ออัปโหลดรูปภาพ</p>
                    <p className="text-muted-foreground text-sm">PNG, JPG ขนาดแนะนำ 1200x630 px</p>
                  </div>
                </>
              )}
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          <p className="text-xs text-muted-foreground">
            รูปภาพที่แสดงเมื่อแชร์ลิงก์ไปยังโซเชียลมีเดีย
          </p>
        </div>

        {/* Google Analytics ID */}
        <div className="space-y-2">
          <Label htmlFor="googleAnalyticsId" className="text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            Google Analytics ID
          </Label>
          <Input
            id="googleAnalyticsId"
            value={formData.googleAnalyticsId}
            onChange={(e) => handleInputChange("googleAnalyticsId", e.target.value)}
            placeholder="G-XXXXXXXXXX หรือ UA-XXXXXXXX-X"
            className="bg-card border-border text-foreground font-mono"
          />
          <p className="text-xs text-muted-foreground">
            ใส่ Measurement ID จาก Google Analytics 4 (เริ่มต้นด้วย G-) หรือ Universal Analytics (UA-)
          </p>
        </div>

        {/* Action Buttons */}
        {hasChanges && (
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSaving}
              className="border-border text-foreground hover:bg-card"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              ยกเลิก
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึกการตั้งค่า
                </>
              )}
            </Button>
          </div>
        )}

        {/* Preview Info */}
        <div className="p-4 rounded-lg bg-info/10 border border-info/20">
          <p className="text-sm text-info font-medium mb-2">
            💡 ตัวอย่างการแสดงผลบน Google
          </p>
          <div className="bg-card rounded p-3 text-left">
            <p className="text-info text-sm hover:underline cursor-pointer truncate">
              {formData.siteTitle || "NineBooking"} 
            </p>
            <p className="text-success text-xs truncate">
              http://localhost:3000
            </p>
            <p className="text-muted-foreground text-xs line-clamp-2">
              {formData.siteDescription || "ระบบจองสินค้าออนไลน์ พร้อมระบบหลังบ้านครบวงจร..."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}