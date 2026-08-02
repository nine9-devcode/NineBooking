"use client"

import { ArrowDownUp, Filter } from "lucide-react"
import { STATUS_CONFIG, OrderStatusKey } from "./constants"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface OrderFiltersProps {
  statusFilter: string
  onFilterChange: (status: string) => void
  sortOrder?: "desc" | "asc"
  onSortChange?: (value: "desc" | "asc") => void
}

export function OrderFilters({
  statusFilter,
  onFilterChange,
  sortOrder = "desc",
  onSortChange,
}: OrderFiltersProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">กรองตามสถานะ:</span>
        </div>

        {onSortChange && (
          <Select value={sortOrder} onValueChange={(v) => onSortChange(v as "desc" | "asc")}>
            <SelectTrigger className="w-[140px] h-8 text-xs border-border">
              <ArrowDownUp className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">ใหม่สุดก่อน</SelectItem>
              <SelectItem value="asc">เก่าสุดก่อน</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onFilterChange("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            statusFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground hover:bg-secondary"
          }`}
        >
          ทั้งหมด
        </button>
        {(Object.entries(STATUS_CONFIG) as [OrderStatusKey, typeof STATUS_CONFIG[OrderStatusKey]][]).map(
          ([key, config]) => (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-secondary"
              }`}
            >
              {config.label}
            </button>
          )
        )}
      </div>
    </div>
  )
}
