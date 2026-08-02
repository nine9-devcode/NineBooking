// components/admin/quotations/quotations-filters.tsx

"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Calendar, X } from "lucide-react"
import { QUOTATION_STATUS_OPTIONS } from "./constants"

interface QuotationsFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  limit: number
  onLimitChange: (value: number) => void
  // Date Filter
  dateFrom?: string
  onDateFromChange?: (value: string) => void
  dateTo?: string
  onDateToChange?: (value: string) => void
}

export function QuotationsFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  limit,
  onLimitChange,
  dateFrom = "",
  onDateFromChange,
  dateTo = "",
  onDateToChange,
}: QuotationsFiltersProps) {
  const hasDateFilter = dateFrom || dateTo

  const handleClearDateFilter = () => {
    onDateFromChange?.("")
    onDateToChange?.("")
  }

  return (
    <div className="bg-card/50 rounded-xl border border-border p-4">
      <div className="flex flex-col gap-4">
        {/* Row 1: Search, Status, Per Page */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาเลขที่ใบเสนอราคา, ชื่อลูกค้า, อีเมล..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-44 bg-card border-border text-foreground">
              <SelectValue placeholder="สถานะทั้งหมด" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all" className="text-foreground">สถานะทั้งหมด</SelectItem>
              {QUOTATION_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-foreground">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Per Page */}
          <Select
            value={limit.toString()}
            onValueChange={(value) => onLimitChange(parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-32 bg-card border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="10" className="text-foreground">10 รายการ</SelectItem>
              <SelectItem value="25" className="text-foreground">25 รายการ</SelectItem>
              <SelectItem value="50" className="text-foreground">50 รายการ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Row 2: Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium whitespace-nowrap">ช่วงวันที่:</span>
          </div>
          
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange?.(e.target.value)}
              className="w-full sm:w-40 bg-card border-border text-foreground [color-scheme:dark]"
              placeholder="จากวันที่"
            />
            <span className="text-muted-foreground hidden sm:inline">—</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange?.(e.target.value)}
              className="w-full sm:w-40 bg-card border-border text-foreground [color-scheme:dark]"
              placeholder="ถึงวันที่"
            />
            
            {hasDateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearDateFilter}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="w-4 h-4 mr-1" />
                ล้าง
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}