"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Link2,
  Search,
  X,
  Loader2,
  Package,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  slug: string
  category: {
    id: string
    name: string
    slug: string
  }
}

interface PairedProduct extends Product {
  pairingId: string
}

interface ExclusivePairingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: {
    id: string
    name: string
    category: {
      id: string
      name: string
    }
  } | null
  onSuccess?: () => void
}

export function ExclusivePairingModal({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ExclusivePairingModalProps) {
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pairedProducts, setPairedProducts] = useState<PairedProduct[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showPaired, setShowPaired] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  const [showCategoryPairings, setShowCategoryPairings] = useState(false)
  const [togglingCategory, setTogglingCategory] = useState(false)

  // โหลดข้อมูลเมื่อเปิด Modal
  useEffect(() => {
    if (open && product) {
      const controller = new AbortController()
      fetchPairedProducts(controller.signal)
      fetchAvailableProducts(controller.signal)
      return () => controller.abort()
    }
  }, [open, product])

  // Reset เมื่อปิด Modal
  useEffect(() => {
    if (!open) {
      setSearch("")
      setSelectedIds(new Set())
      setShowInfo(false)
      setShowCategoryPairings(false)
    }
  }, [open])

  // Toggle showCategoryPairings → auto-save
  const handleToggleCategoryPairings = async (value: boolean) => {
    if (!product) return
    setShowCategoryPairings(value)
    setTogglingCategory(true)
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showCategoryPairings: value }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "เกิดข้อผิดพลาด")
        setShowCategoryPairings(!value) // revert
      } else {
        onSuccess?.()
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึก")
      setShowCategoryPairings(!value) // revert
    } finally {
      setTogglingCategory(false)
    }
  }

  // ดึง Exclusive Pairings ที่มีอยู่
  const fetchPairedProducts = async (signal?: AbortSignal) => {
    if (!product) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/exclusive-pairings?productId=${product.id}`, { signal })
      const data = await res.json()

      if (res.ok) {
        setPairedProducts(data.pairings || [])
        setShowCategoryPairings(data.showCategoryPairings ?? false)
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      console.error("Error fetching paired products:", error)
    } finally {
      setLoading(false)
    }
  }

  // ดึงสินค้าทั้งหมดที่สามารถจับคู่ได้
  const fetchAvailableProducts = async (signal?: AbortSignal) => {
    if (!product) return

    try {
      const res = await fetch(`/api/admin/products?limit=1000&excludeId=${product.id}`, { signal })
      const data = await res.json()

      if (res.ok) {
        setAvailableProducts(data.products || [])
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      console.error("Error fetching available products:", error)
    }
  }

  // ลบ Exclusive Pairing
  const handleRemovePairing = async (pairingId: string, productName: string) => {
    try {
      const res = await fetch(`/api/admin/exclusive-pairings/${pairingId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success(`ยกเลิกการจับคู่กับ ${productName} แล้ว`)
        fetchPairedProducts()
        onSuccess?.()
      } else {
        const data = await res.json()
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลบ")
    }
  }

  // Toggle เลือกสินค้า
  const toggleSelect = (productId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  // บันทึกการจับคู่ใหม่
  const handleSave = async () => {
    if (selectedIds.size === 0 || !product) return

    setSaving(true)

    const results = await Promise.allSettled(
      Array.from(selectedIds).map((productBId) =>
        fetch("/api/admin/exclusive-pairings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productAId: product.id,
            productBId,
          }),
        }).then((res) => {
          if (!res.ok) throw new Error("Failed")
          return res
        })
      )
    )

    const successCount = results.filter((r) => r.status === "fulfilled").length
    const errorCount = results.filter((r) => r.status === "rejected").length

    setSaving(false)
    setSelectedIds(new Set())

    if (successCount > 0) {
      toast.success(`จับคู่สินค้าสำเร็จ ${successCount} รายการ`)
      fetchPairedProducts()
      onSuccess?.()
    }

    if (errorCount > 0) {
      toast.error(`จับคู่ไม่สำเร็จ ${errorCount} รายการ`)
    }
  }

  // กรองสินค้าที่ค้นหา + ยังไม่ได้จับคู่
  const pairedIds = new Set(pairedProducts.map((p) => p.id))
  const filteredProducts = availableProducts.filter((p) => {
    if (pairedIds.has(p.id)) return false
    
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(searchLower) ||
        p.category.name.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-background border-border text-foreground p-0 gap-0">
        {/* Header - Fixed */}
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Link2 className="w-5 h-5 text-primary" />
            จับคู่สินค้าเฉพาะ
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-secondary [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-secondary">
          {/* สินค้าหลัก - Compact */}
          <div className="flex items-center justify-between bg-card rounded-lg p-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{product.name}</p>
                <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                  {product.category.name}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded flex-shrink-0"
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>

          {/* คำอธิบาย - Collapsible */}
          {showInfo && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm text-warning">
              <p className="font-medium mb-1">การจับคู่เฉพาะ (Exclusive)</p>
              <ul className="list-disc list-inside text-warning/80 space-y-0.5 text-xs">
                <li>สินค้านี้จะจับคู่ได้เฉพาะกับสินค้าที่เลือกเท่านั้น</li>
                <li>จะไม่แสดงในการจับคู่หมวดปกติ</li>
                <li>การจับคู่เป็นแบบ 2 ทาง (A↔B)</li>
              </ul>
            </div>
          )}

          {/* สินค้าที่จับคู่แล้ว - Collapsible */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowPaired(!showPaired)}
              className="w-full flex items-center justify-between px-3 py-2 bg-card/50 hover:bg-card transition-colors"
            >
              <span className="text-sm font-medium text-foreground">
                สินค้าที่จับคู่แล้ว ({pairedProducts.length})
              </span>
              {showPaired ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            
            {showPaired && (
              <div className="p-2">
                {loading ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : pairedProducts.length === 0 ? (
                  <p className="text-center py-3 text-muted-foreground text-sm">
                    ยังไม่มีการจับคู่เฉพาะ
                  </p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-secondary [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-secondary">
                    {pairedProducts.map((paired) => (
                      <div
                        key={paired.pairingId}
                        className="flex items-center justify-between bg-card rounded px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{paired.name}</p>
                          <p className="text-xs text-muted-foreground">{paired.category.name}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePairing(paired.pairingId, paired.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ค้นหาสินค้า */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาสินค้าที่ต้องการจับคู่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground h-10"
            />
          </div>

          {/* รายการสินค้าที่เลือกได้ */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-card/50 border-b border-border">
              <span className="text-sm font-medium text-foreground">
                เลือกสินค้าที่ต้องการจับคู่ ({filteredProducts.length})
              </span>
            </div>
            
            <div className="h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-secondary [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-secondary">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Package className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">ไม่พบสินค้า</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredProducts.map((prod) => {
                    const isSelected = selectedIds.has(prod.id)
                    
                    return (
                      <button
                        key={prod.id}
                        onClick={() => toggleSelect(prod.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors text-left ${
                          isSelected
                            ? "bg-primary/20 border border-primary"
                            : "bg-card hover:bg-card border border-transparent"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className={`font-medium text-sm truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {prod.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{prod.category.name}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-foreground" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="border-t border-border bg-background flex-shrink-0">
          {/* Toggle: แสดงสินค้าจากหมวดที่จับคู่ด้วย */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Switch
                id="show-category-pairings"
                checked={showCategoryPairings}
                onCheckedChange={handleToggleCategoryPairings}
                disabled={togglingCategory}
                className="data-[state=unchecked]:bg-secondary"
              />
              <div>
                <Label htmlFor="show-category-pairings" className="text-sm text-foreground cursor-pointer">
                  แสดงสินค้าจากหมวดที่จับคู่ด้วย
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  เปิด: หน้าสินค้าจะแสดงทั้งสินค้าเฉพาะและสินค้าจากหมวดที่จับคู่
                </p>
              </div>
            </div>
            {togglingCategory && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>

          <div className="flex items-center justify-between px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {selectedIds.size > 0 && (
                <>เลือกแล้ว <span className="text-primary font-medium">{selectedIds.size}</span> รายการ</>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-border text-foreground hover:bg-card hover:text-foreground"
              >
                ปิด
              </Button>
              <Button
                onClick={handleSave}
                disabled={selectedIds.size === 0 || saving}
                className="bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    บันทึก
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}