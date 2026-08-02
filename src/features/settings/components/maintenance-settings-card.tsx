// ไฟล์: components/admin/settings/maintenance-settings-card.tsx
// Card สำหรับตั้งค่าเปิด/ปิดเว็บไซต์

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Loader2, Save, Eye, EyeOff, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/utils"

interface MaintenanceSettings {
  showHomePage: boolean
}

export function MaintenanceSettingsCard() {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    showHomePage: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/settings")
      
      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลการตั้งค่าได้")
      }

      const data = await response.json()
      setSettings(data.settings || { showHomePage: true })
      setHasChanges(false)
    } catch (error: unknown) {
      console.error("Error fetching settings:", error)
      toast.error(getErrorMessage(error) || "เกิดข้อผิดพลาดในการดึงข้อมูล")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = () => {
    setSettings((prev) => ({
      ...prev,
      showHomePage: !prev.showHomePage,
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "ไม่สามารถบันทึกการตั้งค่าได้")
      }

      toast.success("บันทึกการตั้งค่าเรียบร้อยแล้ว")
      setHasChanges(false)
    } catch (error: unknown) {
      console.error("Error saving settings:", error)
      toast.error(getErrorMessage(error) || "เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    fetchSettings()
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
          <Eye className="w-5 h-5 text-primary" />
          การใช้งาน
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          จัดการการใช้งานในเว็บไซต์
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Show Home Page Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border hover:border-border transition-colors">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="showHomePage"
                className="text-base font-medium text-foreground cursor-pointer"
              >
                เว็บไซต์หลัก (Main Website)
              </Label>
              {!settings.showHomePage && (
                <span className="px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive rounded-full">
                  ปิดการใช้งาน
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {settings.showHomePage
                ? "เว็บไซต์จะเปิดใช้งานปกติให้ผู้ใช้ทั่วไป"
                : "เว็บไซต์จะถูกปิดใช้งานชั่วคราวจากผู้ใช้ทั่วไป"}
            </p>
          </div>
          <Switch
            id="showHomePage"
            checked={settings.showHomePage}
            onCheckedChange={handleToggle}
            className="ml-4"
          />
        </div>

        {/* Info Message */}
        <div className="flex gap-3 p-4 rounded-lg bg-info/10 border border-info/20">
          <div className="flex-shrink-0 mt-0.5">
            {settings.showHomePage ? (
              <Eye className="w-5 h-5 text-info" />
            ) : (
              <EyeOff className="w-5 h-5 text-info" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-info">
              {settings.showHomePage
                ? "เว็บไซต์เปิดใช้งาน"
                : "เว็บไซต์ปิดการใช้งาน"}
            </p>
            <p className="text-xs text-info/80">
              {settings.showHomePage
                ? "ผู้ใช้สามารถเข้าถึงเว็บไซต์ได้ตามปกติ"
                : "เมื่อผู้ใช้เข้าเว็บไซต์ ระบบจะ redirect ไปหน้าปรับปรุงโดยอัตโนมัติ"}
            </p>
          </div>
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
      </CardContent>
    </Card>
  )
}