"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Link2,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Info,
  ChevronRight,
  FolderTree,
} from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  slug: string
  parentId?: string | null
  children?: Category[]
}

interface PairedCategory {
  pairingId: string
  category: Category
  createdAt: string
}

interface CategoryPairingModalProps {
  open: boolean
  onClose: () => void
  category: Category | null
}

export function CategoryPairingModal({
  open,
  onClose,
  category,
}: CategoryPairingModalProps) {
  const [pairedCategories, setPairedCategories] = useState<PairedCategory[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch pairings และ categories เมื่อเปิด modal
  useEffect(() => {
    if (open && category) {
      fetchPairings()
      fetchAllCategories()
    }
  }, [open, category])

  // Reset state เมื่อปิด modal
  useEffect(() => {
    if (!open) {
      setSelectedCategoryId("")
      setPairedCategories([])
    }
  }, [open])

  // ดึง pairings ของ category นี้
  const fetchPairings = async () => {
    if (!category) return

    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/category-pairings?categoryId=${category.id}`
      )
      const data = await res.json()

      if (res.ok) {
        setPairedCategories(data.pairings || [])
      }
    } catch (error) {
      console.error("Error fetching pairings:", error)
    } finally {
      setLoading(false)
    }
  }

  // ดึง categories ทั้งหมด (สำหรับ dropdown)
  const fetchAllCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories?limit=100")
      const data = await res.json()

      if (res.ok) {
        // เก็บ categories ทั้งหมด
        setAllCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  // เพิ่ม pairing ใหม่
  const handleAddPairing = async () => {
    if (!category || !selectedCategoryId) return

    setAdding(true)
    try {
      const res = await fetch("/api/admin/category-pairings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryAId: category.id,
          categoryBId: selectedCategoryId,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("เพิ่มการจับคู่หมวดหมู่สำเร็จ")
        setSelectedCategoryId("")
        fetchPairings() // Refresh list
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error adding pairing:", error)
      toast.error("เกิดข้อผิดพลาดในการเพิ่มการจับคู่")
    } finally {
      setAdding(false)
    }
  }

  // ลบ pairing
  const handleDeletePairing = async (pairingId: string) => {
    setDeletingId(pairingId)
    try {
      const res = await fetch(`/api/admin/category-pairings/${pairingId}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("ยกเลิกการจับคู่สำเร็จ")
        fetchPairings() // Refresh list
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error deleting pairing:", error)
      toast.error("เกิดข้อผิดพลาดในการยกเลิกการจับคู่")
    } finally {
      setDeletingId(null)
    }
  }

  // สร้าง flat list พร้อม level
  const getFlatCategoriesWithLevel = () => {
    const result: { category: Category; level: number; parentName?: string }[] = []
    
    // หา parent categories (ไม่มี parentId)
    const parents = allCategories.filter((cat) => !cat.parentId)
    
    parents.forEach((parent) => {
      // เพิ่ม parent
      result.push({ category: parent, level: 0 })
      
      // หา children ของ parent นี้
      const children = allCategories.filter((cat) => cat.parentId === parent.id)
      children.forEach((child) => {
        result.push({ category: child, level: 1, parentName: parent.name })
      })
    })
    
    return result
  }

  // กรอง categories ที่ยังไม่ได้จับคู่
  const getAvailableCategories = () => {
    if (!category) return []

    const pairedIds = pairedCategories.map((p) => p.category.id)
    const flatCategories = getFlatCategoriesWithLevel()
    
    return flatCategories.filter(
      (item) => item.category.id !== category.id && !pairedIds.includes(item.category.id)
    )
  }

  // หาชื่อ parent
  const getParentName = (cat: Category) => {
    if (!cat.parentId) return null
    const parent = allCategories.find((c) => c.id === cat.parentId)
    return parent?.name || null
  }

  // แสดง badge หมวดหลัก/หมวดย่อย
  const getCategoryBadge = (cat: Category) => {
    const parentName = getParentName(cat)
    if (parentName) {
      return (
        <Badge variant="outline" className="ml-2 text-xs border-border text-muted-foreground">
          หมวดย่อยของ {parentName}
        </Badge>
      )
    }
    return null
  }

  if (!category) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            จับคู่หมวดหมู่
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            จัดการหมวดหมู่ที่ใช้งานร่วมกับ &quot;{category.name}&quot;
            {getCategoryBadge(category)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Category */}
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-1">หมวดหมู่หลัก</p>
            <div className="flex items-center gap-2">
              {category.parentId ? (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              ) : (
                <FolderTree className="w-4 h-4 text-primary" />
              )}
              <p className="text-lg font-semibold text-foreground">{category.name}</p>
            </div>
            <p className="text-sm text-muted-foreground">{category.slug}</p>
            {(() => {
              const parentName = getParentName(category)
              return parentName ? (
                <p className="text-xs text-muted-foreground mt-1">
                  อยู่ในหมวด: {parentName}
                </p>
              ) : null
            })()}
          </div>

          {/* Paired Categories List */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              หมวดหมู่ที่จับคู่แล้ว ({pairedCategories.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : pairedCategories.length === 0 ? (
              <div className="bg-card/30 rounded-lg p-6 text-center border border-dashed border-border">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  ยังไม่มีหมวดหมู่ที่จับคู่
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pairedCategories.map((paired) => (
                  <div
                    key={paired.pairingId}
                    className="flex items-center justify-between bg-card rounded-lg p-3 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        {paired.category.parentId ? (
                          <ChevronRight className="w-4 h-4 text-primary" />
                        ) : (
                          <FolderTree className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {paired.category.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {paired.category.slug}
                          {getParentName(paired.category) && (
                            <span className="ml-2 text-muted-foreground">
                              (หมวดย่อยของ {getParentName(paired.category)})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePairing(paired.pairingId)}
                      disabled={deletingId === paired.pairingId}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === paired.pairingId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Pairing */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              เพิ่มหมวดหมู่ที่จับคู่
            </h3>

            <div className="flex gap-2">
              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
                disabled={adding}
              >
                <SelectTrigger className="flex-1 bg-card border-border text-foreground">
                  <SelectValue placeholder="เลือกหมวดหมู่..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-64">
                  {(() => {
                    const available = getAvailableCategories()
                    return available.length === 0 ? (
                    <SelectItem value="none" disabled className="text-muted-foreground">
                      ไม่มีหมวดหมู่ที่สามารถจับคู่ได้
                    </SelectItem>
                  ) : (
                    available.map((item) => (
                      <SelectItem
                        key={item.category.id}
                        value={item.category.id}
                        className="text-foreground"
                      >
                        {/* indent หมวดย่อย */}
                        <span className="flex items-center gap-2">
                          {item.level === 1 && (
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          )}
                          {item.level === 0 && (
                            <FolderTree className="w-3 h-3 text-primary" />
                          )}
                          <span className={item.level === 1 ? "text-foreground" : ""}>
                            {item.category.name}
                          </span>
                          {item.level === 1 && item.parentName && (
                            <span className="text-xs text-muted-foreground">
                              ({item.parentName})
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))
                  )
                  })()}
                </SelectContent>
              </Select>

              <Button
                onClick={handleAddPairing}
                disabled={!selectedCategoryId || adding}
                className="bg-primary hover:bg-primary/90"
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-info/10 border border-info/30 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
              <div className="text-sm text-info">
                <p className="font-medium mb-1">การจับคู่แบบ Two-way</p>
                <p className="text-info/80">
                  เมื่อลูกค้าเลือกสินค้าจากหมวด &quot;{category.name}&quot; 
                  ระบบจะแนะนำสินค้าจากหมวดที่จับคู่ไว้ (ไม่บังคับ)
                </p>
                <p className="text-info/80 mt-1">
                  <strong>หมายเหตุ:</strong> สามารถจับคู่ได้ทั้งหมวดหลักและหมวดย่อย
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}