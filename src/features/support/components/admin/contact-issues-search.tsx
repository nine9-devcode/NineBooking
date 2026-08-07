// components/admin/contact-issues/contact-issues-search.tsx
"use client"

import { useState } from "react"
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

interface ContactIssuesSearchProps {
  onSearch: (value: string) => void
  onStatusChange: (value: string) => void
  onCategoryChange?: (value: string) => void
  dateFrom?: string
  onDateFromChange?: (value: string) => void
  dateTo?: string
  onDateToChange?: (value: string) => void
  currentStatus?: string
}

export default function ContactIssuesSearch({
  onSearch,
  onStatusChange,
  onCategoryChange,
  dateFrom = "",
  onDateFromChange,
  dateTo = "",
  onDateToChange,
  currentStatus,
}: ContactIssuesSearchProps) {
  const [searchValue, setSearchValue] = useState("")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    onSearch(value)
  }

  const hasDateFilter = dateFrom || dateTo

  const handleClearDateFilter = () => {
    onDateFromChange?.("")
    onDateToChange?.("")
  }

  return (
    <div className="bg-card/50 rounded-xl border border-border p-4">
      <div className="flex flex-col gap-4">
        {/* Row 1: Search + Status */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ค้นหา เลขที่ติดตาม, หัวข้อ, ชื่อผู้แจ้ง, อีเมล..."
              value={searchValue}
              onChange={handleSearchChange}
              className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          {/* Status Filter */}
          <Select value={!currentStatus ? "all" : currentStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full sm:w-44 bg-card border-border text-foreground">
              <SelectValue placeholder="สถานะทั้งหมด" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all" className="text-foreground">
                สถานะทั้งหมด
              </SelectItem>
              <SelectItem value="PENDING" className="text-foreground">
                รอดำเนินการ
              </SelectItem>
              <SelectItem value="IN_PROGRESS" className="text-foreground">
                กำลังดำเนินการ
              </SelectItem>
              <SelectItem value="CLOSED" className="text-foreground">
                เสร็จสิ้น
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          {onCategoryChange && (
            <Select onValueChange={onCategoryChange} defaultValue="all">
              <SelectTrigger className="w-full sm:w-44 bg-card border-border text-foreground">
                <SelectValue placeholder="ประเภททั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="all" className="text-foreground">
                  ประเภททั้งหมด
                </SelectItem>
                <SelectItem value="BOOKING" className="text-foreground">
                  การจอง
                </SelectItem>
                <SelectItem value="PAYMENT" className="text-foreground">
                  การชำระเงิน
                </SelectItem>
                <SelectItem value="USAGE_ISSUE" className="text-foreground">
                  ปัญหาการใช้งาน
                </SelectItem>
                <SelectItem value="ACCOUNT" className="text-foreground">
                  บัญชีผู้ใช้
                </SelectItem>
                <SelectItem value="OTHER" className="text-foreground">
                  อื่นๆ
                </SelectItem>
              </SelectContent>
            </Select>
          )}
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
