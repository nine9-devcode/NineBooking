"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface CategoriesSearchProps {
  onSearchChange: (search: string) => void
  onStatusChange: (status: string) => void
  defaultSearch?: string
  defaultStatus?: string
}

export function CategoriesSearch({
  onSearchChange,
  onStatusChange,
  defaultSearch = "",
  defaultStatus = "all",
}: CategoriesSearchProps) {
  const [search, setSearch] = useState(defaultSearch)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onSearchChange(value)
  }

  const handleClear = () => {
    setSearch("")
    onSearchChange("")
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search Input - realtime */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="ค้นหาหมวดหมู่..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
        />
        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status Filter */}
      <Select
        value={defaultStatus}
        onValueChange={onStatusChange}
      >
        <SelectTrigger className="w-full sm:w-[180px] bg-card border-border text-foreground">
          <SelectValue placeholder="ทุกสถานะ" />
        </SelectTrigger>
        <SelectContent className="bg-background border-border">
          <SelectItem value="all" className="text-foreground">ทุกสถานะ</SelectItem>
          <SelectItem value="active" className="text-foreground">เปิดใช้งาน</SelectItem>
          <SelectItem value="inactive" className="text-foreground">ปิดใช้งาน</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
