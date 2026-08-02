"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

interface OrderSearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
}

export function OrderSearchBar({ value, onChange, onClear }: OrderSearchBarProps) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        className="pl-10 pr-10 bg-card border-border focus:border-primary"
        placeholder="ค้นหาเลขที่ใบจอง เช่น ORD-20260224-001"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground hover:text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
