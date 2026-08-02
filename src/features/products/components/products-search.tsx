"use client"

import { Search, X, ArrowUpDown, Layers, Calendar, SortAsc, SortDesc, TrendingUp } from "lucide-react"
import { useEffect, useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

export type SortOption =
  | "category"
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "popular"

interface SortOptionItem {
  value: SortOption
  label: string
  icon: React.ReactNode
}

const sortOptions: SortOptionItem[] = [
  {
    value: "category",
    label: "เรียงตามหมวด",
    icon: <Layers className="w-4 h-4" />
  },
  {
    value: "newest",
    label: "ใหม่ล่าสุด",
    icon: <Calendar className="w-4 h-4" />
  },
  {
    value: "oldest",
    label: "เก่าสุด",
    icon: <Calendar className="w-4 h-4" />
  },
  {
    value: "name-asc",
    label: "ชื่อ A-Z",
    icon: <SortAsc className="w-4 h-4" />
  },
  {
    value: "name-desc",
    label: "ชื่อ Z-A",
    icon: <SortDesc className="w-4 h-4" />
  },
  {
    value: "popular",
    label: "ยอดนิยม",
    icon: <TrendingUp className="w-4 h-4" />
  }
]

interface ProductsSearchProps {
  searchValue: string
  onSearchChange: (value: string) => void
  sortValue: SortOption
  onSortChange: (value: SortOption) => void
}

export function ProductsSearch({
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
}: ProductsSearchProps) {
  const [inputValue, setInputValue] = useState(searchValue)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = sortOptions.find(opt => opt.value === sortValue) || sortOptions[0]

  // Debounce search - รอ 300ms หลังพิมพ์เสร็จ
  useEffect(() => {
      const timer = setTimeout(() => {
        if (inputValue !== searchValue) {
          onSearchChange(inputValue)
        }
      }, 300)

      return () => clearTimeout(timer)
    }, [inputValue, onSearchChange, searchValue])

  // Sync with external value
  useEffect(() => {
    setInputValue(searchValue)
  }, [searchValue])

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isDropdownOpen])

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="ค้นหาสินค้า..."
          aria-label="ค้นหาสินค้า"
          className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-card"
        />
        {inputValue && (
          <button
            onClick={() => {
              setInputValue("")
              onSearchChange("")
            }}
            aria-label="ล้างคำค้นหา"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-label={`เรียงลำดับ: ${selectedOption.label}`}
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg hover:border-primary hover:bg-primary/10 transition-colors text-sm font-medium text-foreground whitespace-nowrap min-w-[160px]"
        >
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <span>{selectedOption.label}</span>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden" role="listbox" aria-label="ตัวเลือกการเรียงลำดับ">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value)
                  setIsDropdownOpen(false)
                }}
                role="option"
                aria-selected={sortValue === option.value}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left",
                  sortValue === option.value
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span className={cn(
                  sortValue === option.value ? "text-foreground" : "text-muted-foreground"
                )}>
                  {option.icon}
                </span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
