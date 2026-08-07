"use client"

import { ArrowUpDown, SortAsc, SortDesc, TrendingUp, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"

export type SortOption = 
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

interface ProductsSortProps {
  value: SortOption
  onChange: (value: SortOption) => void
  totalItems?: number
}

export function ProductsSort({ value, onChange, totalItems }: ProductsSortProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = sortOptions.find(opt => opt.value === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Total Items */}
      {totalItems !== undefined && (
        <div className="text-sm text-muted-foreground">
          พบ <span className="font-semibold text-foreground">{totalItems}</span> รายการ
        </div>
      )}

      {/* Sort Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:border-primary hover:bg-primary/10 transition-colors text-sm font-medium text-foreground"
        >
          <ArrowUpDown className="w-4 h-4" />
          <span className="hidden sm:inline">เรียงตาม:</span>
          <span>{selectedOption?.label}</span>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left",
                  value === option.value
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span className={cn(
                  value === option.value ? "text-foreground" : "text-muted-foreground"
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