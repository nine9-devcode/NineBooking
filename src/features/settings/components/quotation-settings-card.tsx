// components/admin/settings/quotation-settings-card.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Loader2,
  Save,
  RefreshCw,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/utils"

interface QuotationSettings {
  id: string
  companyNameTh: string
  companyNameEn: string
  address: string
  taxId: string
  phone: string
  website: string
}

interface Seller {
  id: string
  name: string
  phone: string
  isActive: boolean
}

export function QuotationSettingsCard() {
  // Company settings state
  const [settings, setSettings] = useState<QuotationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [formData, setFormData] = useState({
    companyNameTh: "",
    companyNameEn: "",
    address: "",
    taxId: "",
    phone: "",
    website: "",
  })

  // Seller state
  const [sellers, setSellers] = useState<Seller[]>([])
  const [sellersLoading, setSellersLoading] = useState(true)
  const [newSellerName, setNewSellerName] = useState("")
  const [newSellerPhone, setNewSellerPhone] = useState("")
  const [addingseller, setAddingSeller] = useState(false)
  const [settingActive, setSettingActive] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
    fetchSellers()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/admin/quotation-settings")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSettings(data.settings)
      setFormData({
        companyNameTh: data.settings.companyNameTh,
        companyNameEn: data.settings.companyNameEn,
        address: data.settings.address,
        taxId: data.settings.taxId,
        phone: data.settings.phone,
        website: data.settings.website,
      })
      setHasChanges(false)
    } catch {
      toast.error("ไม่สามารถดึงข้อมูลการตั้งค่าได้")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSellers = async () => {
    try {
      setSellersLoading(true)
      const res = await fetch("/api/admin/quotation-sellers")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSellers(data.sellers)
    } catch {
      toast.error("ไม่สามารถดึงข้อมูลผู้ขายได้")
    } finally {
      setSellersLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const res = await fetch("/api/admin/quotation-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "บันทึกไม่สำเร็จ")
      }
      const data = await res.json()
      setSettings(data.settings)
      setHasChanges(false)
      toast.success("บันทึกข้อมูลบริษัทเรียบร้อยแล้ว")
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (!settings) return
    setFormData({
      companyNameTh: settings.companyNameTh,
      companyNameEn: settings.companyNameEn,
      address: settings.address,
      taxId: settings.taxId,
      phone: settings.phone,
      website: settings.website,
    })
    setHasChanges(false)
  }

  const handleAddSeller = async () => {
    if (!newSellerName.trim() || !newSellerPhone.trim()) {
      toast.error("กรุณากรอกชื่อและเบอร์โทร")
      return
    }
    try {
      setAddingSeller(true)
      const res = await fetch("/api/admin/quotation-sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSellerName.trim(), phone: newSellerPhone.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "เพิ่มผู้ขายไม่สำเร็จ")
      }
      setNewSellerName("")
      setNewSellerPhone("")
      toast.success("เพิ่มผู้ขายเรียบร้อยแล้ว")
      fetchSellers()
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "เกิดข้อผิดพลาด")
    } finally {
      setAddingSeller(false)
    }
  }

  const handleSetActive = async (id: string) => {
    try {
      setSettingActive(id)
      const res = await fetch(`/api/admin/quotation-sellers/${id}`, { method: "PATCH" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "ไม่สามารถตั้งค่าได้")
      }
      toast.success("เลือกผู้ขายเรียบร้อยแล้ว")
      fetchSellers()
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "เกิดข้อผิดพลาด")
    } finally {
      setSettingActive(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    try {
      setDeletingId(deleteConfirmId)
      const res = await fetch(`/api/admin/quotation-sellers/${deleteConfirmId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "ลบไม่สำเร็จ")
      }
      toast.success("ลบผู้ขายเรียบร้อยแล้ว")
      fetchSellers()
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "เกิดข้อผิดพลาด")
    } finally {
      setDeletingId(null)
      setDeleteConfirmId(null)
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
    <>
      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            ตั้งค่า PDF ใบเสนอราคา
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            ข้อมูลบริษัทและผู้ขายที่แสดงในใบเสนอราคา PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* ===== Company Info ===== */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2">
              ข้อมูลบริษัท
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyNameTh" className="text-foreground">
                  ชื่อบริษัท (ภาษาไทย) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyNameTh"
                  value={formData.companyNameTh}
                  onChange={(e) => handleInputChange("companyNameTh", e.target.value)}
                  className="bg-card border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyNameEn" className="text-foreground">
                  ชื่อบริษัท (ภาษาอังกฤษ)
                </Label>
                <Input
                  id="companyNameEn"
                  value={formData.companyNameEn}
                  onChange={(e) => handleInputChange("companyNameEn", e.target.value)}
                  className="bg-card border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-foreground">
                  ที่อยู่
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="bg-card border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId" className="text-foreground">
                    เลขประจำตัวผู้เสียภาษี
                  </Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange("taxId", e.target.value)}
                    className="bg-card border-border text-foreground font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">
                    โทรศัพท์
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="bg-card border-border text-foreground"
                    placeholder="02-xxx-xxxx, 08x-xxx-xxxx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-foreground">
                  เว็บไซต์
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  className="bg-card border-border text-foreground"
                  placeholder="www.example.co.th"
                />
              </div>
            </div>

            {hasChanges && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
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
                      บันทึก
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* ===== Sellers ===== */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border pb-2">
              รายชื่อผู้ขาย
            </h3>

            {/* Seller list */}
            {sellersLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : sellers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">ยังไม่มีผู้ขาย</p>
            ) : (
              <div className="space-y-2">
                {sellers.map((seller) => (
                  <div
                    key={seller.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      seller.isActive
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-card/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <User
                        className={`w-4 h-4 flex-shrink-0 ${seller.isActive ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${seller.isActive ? "text-foreground" : "text-foreground"}`}
                        >
                          {seller.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{seller.phone}</p>
                      </div>
                      {seller.isActive && (
                        <span className="flex-shrink-0 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                          ใช้งานอยู่
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {!seller.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetActive(seller.id)}
                          disabled={settingActive === seller.id}
                          className="border-border text-foreground hover:bg-secondary text-xs h-7 px-2"
                        >
                          {settingActive === seller.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              เลือก
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirmId(seller.id)}
                        disabled={deletingId === seller.id}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                      >
                        {deletingId === seller.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new seller form */}
            <div className="flex gap-2 pt-1">
              <Input
                value={newSellerName}
                onChange={(e) => setNewSellerName(e.target.value)}
                placeholder="ชื่อผู้ขาย"
                className="bg-card border-border text-foreground flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleAddSeller()}
              />
              <Input
                value={newSellerPhone}
                onChange={(e) => setNewSellerPhone(e.target.value)}
                placeholder="เบอร์โทร"
                className="bg-card border-border text-foreground w-36"
                onKeyDown={(e) => e.key === "Enter" && handleAddSeller()}
              />
              <Button
                onClick={handleAddSeller}
                disabled={addingseller || !newSellerName.trim() || !newSellerPhone.trim()}
                size="sm"
                className="bg-primary hover:bg-primary/90 flex-shrink-0"
              >
                {addingseller ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    เพิ่ม
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">ยืนยันการลบผู้ขาย?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              การลบจะไม่สามารถกู้คืนได้ คุณต้องการดำเนินการต่อหรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-foreground border-border hover:bg-secondary">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
