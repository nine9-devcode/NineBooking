"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronDown, ChevronRight, Package } from "lucide-react"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
  _count: {
    products: number
  }
  children?: Category[]
}

interface CategorySidebarProps {
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string | null, name?: string, slug?: string) => void
}

let cachedCategories: Category[] | null = null
let cachedTotalProducts: number | null = null
let cachedExpandedIds: Set<string> = new Set()
let cacheTimestamp: number = 0

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export function CategorySidebar({
  selectedCategoryId,
  onSelectCategory,
}: CategorySidebarProps) {
  const [categories, setCategories] = useState<Category[]>(cachedCategories || [])
  const [totalProducts, setTotalProducts] = useState(cachedTotalProducts || 0)
  const [loading, setLoading] = useState(() => {
    const isCacheValid = cachedCategories && Date.now() - cacheTimestamp < CACHE_TTL_MS
    return !isCacheValid
  })
  const [expandedIds, setExpandedIds] = useState<Set<string>>(cachedExpandedIds)
  const hasFetched = useRef(false)

  useEffect(() => {
    const isCacheValid = cachedCategories && Date.now() - cacheTimestamp < CACHE_TTL_MS
    if (isCacheValid || hasFetched.current) return

    const fetchCategories = async () => {
      hasFetched.current = true
      try {
        const res = await fetch("/api/categories")
        const data = await res.json()

        cachedCategories = data.categories || []
        cachedTotalProducts = data.totalProducts || 0
        cacheTimestamp = Date.now()

        setCategories(cachedCategories || [])
        setTotalProducts(cachedTotalProducts || 0)
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    if (!selectedCategoryId || categories.length === 0) return

    for (const parent of categories) {
      if (parent.children?.some((child) => child.id === selectedCategoryId)) {
        if (!expandedIds.has(parent.id)) {
          setExpandedIds((prev) => {
            const newSet = new Set(prev)
            newSet.add(parent.id)
            cachedExpandedIds = newSet
            return newSet
          })
        }
        break
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, categories])

  const toggleExpand = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      cachedExpandedIds = newSet
      return newSet
    })
  }

  const getTotalCount = useCallback((category: Category): number => {
    let count = category._count.products
    if (category.children) {
      category.children.forEach((child) => {
        count += child._count.products
      })
    }
    return count
  }, [])

  if (loading) {
    return (
      <div className="py-4">
        <div className="px-4 mb-4">
          <div className="h-4 w-28 bg-secondary rounded animate-pulse" />
        </div>
        <div className="space-y-1 px-2">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-secondary rounded animate-pulse" />
              <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
            </div>
            <div className="h-5 w-8 bg-secondary rounded-full animate-pulse" />
          </div>
          <div className="border-t border-border mx-4 my-2" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5">
              <div
                className="h-4 bg-secondary rounded animate-pulse"
                style={{ width: `${60 + i * 10}%` }}
              />
              <div className="h-5 w-8 bg-secondary rounded-full animate-pulse ml-2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="px-4 mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          หมวดหมู่สินค้า
        </h2>
      </div>

      <nav aria-label="หมวดหมู่สินค้า">
        <ul className="space-y-1 px-2" role="tree">
          {/* สินค้าทั้งหมด */}
          <li>
            <button
              onClick={() => onSelectCategory(null, "สินค้าทั้งหมด", undefined)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors font-medium",
                selectedCategoryId === null
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Package className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">สินค้าทั้งหมด</span>
              </div>
              <span
                className={cn(
                  "text-sm px-2 py-0.5 rounded-full flex-shrink-0 ml-2",
                  selectedCategoryId === null
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {totalProducts}
              </span>
            </button>
          </li>

          <li className="py-2">
            <div className="border-t border-border mx-4" />
          </li>

          {/* Categories */}
          {categories.map((category) => {
            const hasChildren = category.children && category.children.length > 0
            const isExpanded = expandedIds.has(category.id)
            const isSelected = selectedCategoryId === category.id
            const hasSelectedChild = category.children?.some(
              (child) => child.id === selectedCategoryId
            )

            return (
              <li key={category.id} role="treeitem">
                <div className="flex items-center">
                  {hasChildren ? (
                    <button
                      onClick={(e) => toggleExpand(category.id, e)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "ย่อ" : "ขยาย"} ${category.name}`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight
                          className={cn(
                            "w-4 h-4",
                            hasSelectedChild ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                      )}
                    </button>
                  ) : (
                    <div className="w-8 flex-shrink-0" />
                  )}

                  <button
                    onClick={() => onSelectCategory(category.id, category.name, category.slug)}
                    className={cn(
                      "flex-1 min-w-0 flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors font-medium text-left",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    <span className="truncate min-w-0 flex-1">{category.name}</span>
                    <span
                      className={cn(
                        "text-sm px-2 py-0.5 rounded-full flex-shrink-0 ml-2",
                        isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {getTotalCount(category)}
                    </span>
                  </button>
                </div>

                {hasChildren && isExpanded && (
                  <ul className="mt-1 space-y-1" role="group">
                    {category.children!.map((child, index) => {
                      const isChildSelected = selectedCategoryId === child.id
                      const isLastChild = index === category.children!.length - 1

                      return (
                        <li key={child.id} className="relative" role="treeitem">
                          <div className="absolute left-[18px] top-0 bottom-0 flex flex-col items-center">
                            <div
                              className={cn(
                                "w-px bg-secondary",
                                isLastChild ? "h-[18px]" : "h-full"
                              )}
                            />
                          </div>
                          <div className="absolute left-[18px] top-[18px] w-3 h-px bg-secondary" />

                          <button
                            onClick={() => onSelectCategory(child.id, child.name, child.slug)}
                            className={cn(
                              "w-full flex items-center justify-between pl-10 pr-4 py-2 rounded-lg transition-colors text-sm",
                              isChildSelected
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            )}
                          >
                            <span className="truncate min-w-0 flex-1">{child.name}</span>
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2",
                                isChildSelected
                                  ? "bg-primary-foreground/20 text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {child._count.products}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}

          {categories.length === 0 && (
            <li className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">ยังไม่มีหมวดหมู่</p>
            </li>
          )}
        </ul>
      </nav>
    </div>
  )
}
