"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Package, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { CategoryRow } from "./category-row"
import { CategoryPairingModal } from "./category-pairing-modal"

interface PairedCategory {
  pairingId: string
  category: {
    id: string
    name: string
    slug: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  parentId: string | null
  sortOrder: number
  parent?: {
    id: string
    name: string
    slug: string
    sortOrder: number
  } | null
  children?: Category[]
  _count: {
    products: number
    children: number
  }
}

interface CategoriesTableProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onRefresh?: () => void
  onToggleStatus?: (category: Category) => void
  togglingId?: string | null
}

export function CategoriesTable({
  categories,
  onEdit,
  onDelete,
  onRefresh,
  onToggleStatus,
  togglingId = null,
}: CategoriesTableProps) {
  // State สำหรับ Pairing Modal
  const [pairingModalOpen, setPairingModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  // State สำหรับเก็บ pairings ของแต่ละ category
  const [categoryPairings, setCategoryPairings] = useState<
    Record<string, PairedCategory[]>
  >({})
  const [loadingPairings, setLoadingPairings] = useState(false)

  // State สำหรับ sortOrder
  const [localSortOrders, setLocalSortOrders] = useState<
    Record<string, number>
  >({})
  const [originalSortOrders, setOriginalSortOrders] = useState<
    Record<string, number>
  >({})
  const [hasChanges, setHasChanges] = useState(false)
  const [savingSort, setSavingSort] = useState(false)
  const [movingId, setMovingId] = useState<string | null>(null)

  // Initialize localSortOrders จาก categories
  useEffect(() => {
    const sortOrders: Record<string, number> = {}
    categories.forEach((cat) => {
      sortOrders[cat.id] = cat.sortOrder > 0 ? cat.sortOrder : 1
    })
    setLocalSortOrders(sortOrders)
    setOriginalSortOrders(sortOrders)
    setHasChanges(false)
  }, [categories])

  // Fetch pairings ทั้งหมดในครั้งเดียว แล้ว group by categoryId
  useEffect(() => {
    const fetchAllPairings = async () => {
      if (categories.length === 0) return

      setLoadingPairings(true)
      try {
        const res = await fetch("/api/admin/category-pairings")
        const data = await res.json()

        if (res.ok) {
          const pairingsMap: Record<string, PairedCategory[]> = {}
          const categoryIds = new Set(categories.map((c) => c.id))

          for (const pairing of data.pairings || []) {
            const aId = pairing.categoryA?.id || pairing.categoryAId
            const bId = pairing.categoryB?.id || pairing.categoryBId

            // เพิ่ม pairing ให้ category A (ถ้าอยู่ในหน้านี้)
            if (categoryIds.has(aId)) {
              if (!pairingsMap[aId]) pairingsMap[aId] = []
              pairingsMap[aId].push({
                pairingId: pairing.id,
                category: pairing.categoryB,
              })
            }

            // เพิ่ม pairing ให้ category B (ถ้าอยู่ในหน้านี้)
            if (categoryIds.has(bId)) {
              if (!pairingsMap[bId]) pairingsMap[bId] = []
              pairingsMap[bId].push({
                pairingId: pairing.id,
                category: pairing.categoryA,
              })
            }
          }

          setCategoryPairings(pairingsMap)
        }
      } catch (error) {
        console.error("Error fetching pairings:", error)
      } finally {
        setLoadingPairings(false)
      }
    }

    fetchAllPairings()
  }, [categories])

  // Handle เปิด Pairing Modal
  const handleOpenPairing = (category: Category) => {
    setSelectedCategory(category)
    setPairingModalOpen(true)
  }

  // Handle ปิด Pairing Modal และ refresh pairings
  const handleClosePairingModal = () => {
    setPairingModalOpen(false)
    if (selectedCategory) {
      fetchCategoryPairings(selectedCategory.id)
    }
    setSelectedCategory(null)
  }

  // Fetch pairings ของ category เดียว
  const fetchCategoryPairings = async (categoryId: string) => {
    try {
      const res = await fetch(
        `/api/admin/category-pairings?categoryId=${categoryId}`
      )
      const data = await res.json()
      if (res.ok) {
        setCategoryPairings((prev) => ({
          ...prev,
          [categoryId]: data.pairings || [],
        }))
      }
    } catch (error) {
      console.error("Error fetching pairings:", error)
    }
  }

  // Handle sortOrder change (manual input)
  const handleSortOrderChange = useCallback(
    (categoryId: string, newSortOrder: number) => {
      setLocalSortOrders((prev) => ({
        ...prev,
        [categoryId]: newSortOrder,
      }))
      setHasChanges(true)
    },
    []
  )

  // Save sortOrder changes (manual input - ส่งเฉพาะที่เปลี่ยน)
  const handleSaveSortOrder = async () => {
    setSavingSort(true)
    try {
      const categoriesToUpdate = Object.entries(localSortOrders)
        .filter(([id, sortOrder]) => originalSortOrders[id] !== sortOrder)
        .map(([id, sortOrder]) => ({ id, sortOrder }))

      if (categoriesToUpdate.length === 0) {
        setHasChanges(false)
        setSavingSort(false)
        return
      }

      const res = await fetch("/api/admin/categories/sort", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: categoriesToUpdate }),
      })

      if (res.ok) {
        toast.success("บันทึกลำดับหมวดหมู่สำเร็จ")
        setHasChanges(false)
        onRefresh?.()
      } else {
        const data = await res.json()
        toast.error(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      console.error("Error saving sort order:", error)
      toast.error("เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSavingSort(false)
    }
  }

  // ลูกศร swap sortOrder กับ category ข้างบน/ล่าง แล้ว auto-save
  const handleMoveCategory = async (categoryId: string, direction: "up" | "down") => {
    const cat = categories.find((c) => c.id === categoryId)
    if (!cat) return

    // หา siblings (หมวดเดียวกัน: parent เดียวกัน)
    const siblings = categories
      .filter((c) => c.parentId === cat.parentId)
      .sort((a, b) => (localSortOrders[a.id] ?? a.sortOrder) - (localSortOrders[b.id] ?? b.sortOrder))

    const currentIndex = siblings.findIndex((c) => c.id === categoryId)
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= siblings.length) return

    const targetCat = siblings[targetIndex]
    const currentSort = localSortOrders[categoryId] ?? cat.sortOrder
    const targetSort = localSortOrders[targetCat.id] ?? targetCat.sortOrder

    // Swap sort orders locally
    setLocalSortOrders((prev) => ({
      ...prev,
      [categoryId]: targetSort,
      [targetCat.id]: currentSort,
    }))

    // Auto-save ทันที
    setMovingId(categoryId)
    try {
      const res = await fetch("/api/admin/categories/sort", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: [
            { id: categoryId, sortOrder: targetSort },
            { id: targetCat.id, sortOrder: currentSort },
          ],
        }),
      })

      if (res.ok) {
        onRefresh?.()
      } else {
        // Revert on error
        setLocalSortOrders((prev) => ({
          ...prev,
          [categoryId]: currentSort,
          [targetCat.id]: targetSort,
        }))
        toast.error("เกิดข้อผิดพลาดในการย้ายลำดับ")
      }
    } catch (error) {
      console.error("Error moving category:", error)
      setLocalSortOrders((prev) => ({
        ...prev,
        [categoryId]: currentSort,
        [targetCat.id]: targetSort,
      }))
      toast.error("เกิดข้อผิดพลาดในการย้ายลำดับ")
    } finally {
      setMovingId(null)
    }
  }

  // คำนวณว่า category สามารถขยับขึ้น/ลงได้ไหม
  const canMove = (categoryId: string, direction: "up" | "down"): boolean => {
    const cat = categories.find((c) => c.id === categoryId)
    if (!cat) return false

    const siblings = categories
      .filter((c) => c.parentId === cat.parentId)
      .sort((a, b) => (localSortOrders[a.id] ?? a.sortOrder) - (localSortOrders[b.id] ?? b.sortOrder))

    const currentIndex = siblings.findIndex((c) => c.id === categoryId)
    if (direction === "up") return currentIndex > 0
    return currentIndex < siblings.length - 1
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="w-16 h-16 text-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          ยังไม่มีหมวดหมู่
        </h3>
        <p className="text-muted-foreground mb-4">
          เริ่มต้นสร้างหมวดหมู่สินค้าแรกของคุณ
        </p>
      </div>
    )
  }

  // สร้าง map ของ parentSortOrder จาก localSortOrders (รองรับค่าที่ยังไม่ save)
  const parentSortOrderMap: Record<string, number> = {}
  categories.forEach((cat) => {
    if (!cat.parentId) {
      parentSortOrderMap[cat.id] = localSortOrders[cat.id] ?? cat.sortOrder ?? 1
    }
  })

  return (
    <TooltipProvider>
      {/* ปุ่มบันทึกลำดับ (สำหรับ manual input) */}
      {hasChanges && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-center justify-between">
          <p className="text-warning text-sm">
            มีการเปลี่ยนแปลงลำดับหมวดหมู่ที่ยังไม่ได้บันทึก
          </p>
          <Button
            onClick={handleSaveSortOrder}
            disabled={savingSort}
            className="bg-warning hover:bg-warning text-foreground"
            size="sm"
          >
            {savingSort ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            บันทึกลำดับ
          </Button>
        </div>
      )}

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-background hover:bg-background">
              <TableHead className="hidden md:table-cell text-muted-foreground w-28">ลำดับ</TableHead>
              <TableHead className="text-muted-foreground">ชื่อหมวดหมู่</TableHead>
              <TableHead className="hidden md:table-cell text-muted-foreground">คำอธิบาย</TableHead>
              <TableHead className="hidden sm:table-cell text-muted-foreground text-center">สินค้า</TableHead>
              <TableHead className="hidden md:table-cell text-muted-foreground text-center">
                หมวดย่อย
              </TableHead>
              <TableHead className="hidden md:table-cell text-muted-foreground">จับคู่กับ</TableHead>
              <TableHead className="text-muted-foreground text-center">สถานะ</TableHead>
              <TableHead className="hidden md:table-cell text-muted-foreground">วันที่สร้าง</TableHead>
              <TableHead className="text-muted-foreground text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={{
                  ...category,
                  sortOrder: localSortOrders[category.id] ?? category.sortOrder ?? 1,
                }}
                pairings={categoryPairings[category.id] || []}
                onEdit={onEdit}
                onDelete={onDelete}
                onOpenPairing={handleOpenPairing}
                onSortOrderChange={handleSortOrderChange}
                onMoveUp={() => handleMoveCategory(category.id, "up")}
                onMoveDown={() => handleMoveCategory(category.id, "down")}
                canMoveUp={canMove(category.id, "up")}
                canMoveDown={canMove(category.id, "down")}
                isMoving={movingId === category.id}
                savingSort={savingSort}
                parentSortOrder={category.parentId ? parentSortOrderMap[category.parentId] : undefined}
                onToggleStatus={onToggleStatus}
                togglingId={togglingId}
              />
            ))}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Pairing Modal */}
      <CategoryPairingModal
        open={pairingModalOpen}
        onClose={handleClosePairingModal}
        category={selectedCategory}
      />
    </TooltipProvider>
  )
}
