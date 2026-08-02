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
import { Search } from "lucide-react"

interface Category {
  id: string
  name: string
}

interface ProductsSearchProps {
  onSearchChange: (search: string) => void
  onCategoryChange: (categoryId: string) => void
  onStatusChange: (status: string) => void
  categories: Category[]
  defaultSearch?: string
  defaultCategory?: string
  defaultStatus?: string
}

export function ProductsSearch({
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  categories,
  defaultSearch = "",
  defaultCategory = "all",
  defaultStatus = "all",
}: ProductsSearchProps) {
  const [search, setSearch] = useState(defaultSearch)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onSearchChange(value)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="ค้นหาชื่อสินค้า, SKU, คำอธิบาย..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
        />
      </div>

      {/* Category Filter */}
      <Select
        value={defaultCategory}
        onValueChange={onCategoryChange}
      >
        <SelectTrigger className="w-full sm:w-[200px] bg-card border-border text-foreground">
          <SelectValue placeholder="ทุกหมวดหมู่" />
        </SelectTrigger>
        <SelectContent className="bg-background border-border">
          <SelectItem value="all" className="text-foreground">
            ทุกหมวดหมู่
          </SelectItem>
          {categories.map((category) => (
            <SelectItem
              key={category.id}
              value={category.id}
              className="text-foreground"
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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