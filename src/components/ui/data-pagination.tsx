"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DataPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void

  /** จำนวนรายการทั้งหมด — ถ้าส่งมาจะแสดงข้อความ "แสดง 1-10 จาก 42 รายการ" */
  total?: number
  /** จำนวนต่อหน้า จำเป็นเมื่อส่ง total มาด้วย */
  pageSize?: number
  /** ส่งมาเมื่อต้องการให้ผู้ใช้เลือกจำนวนต่อหน้าได้เอง */
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]

  className?: string
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const MAX_VISIBLE_PAGES = 5

/** คำนวณช่วงเลขหน้าที่จะแสดง ให้หน้าปัจจุบันอยู่กลางเท่าที่เป็นไปได้ */
function visiblePages(page: number, totalPages: number): number[] {
  let start = Math.max(1, page - Math.floor(MAX_VISIBLE_PAGES / 2))
  const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1)

  if (end - start + 1 < MAX_VISIBLE_PAGES) {
    start = Math.max(1, end - MAX_VISIBLE_PAGES + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

/**
 * ตัวแบ่งหน้าที่ใช้ร่วมกันทุกตารางในระบบ
 * เดิมมีคอมโพเนนต์แบบนี้ 7 ชุดที่เขียนแยกกัน ต่างกันแค่ชื่อ prop
 */
export function DataPagination({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
}: DataPaginationProps) {
  const showPageSize = Boolean(onPageSizeChange && pageSize)
  // มีหน้าเดียวและไม่มีตัวเลือกจำนวนต่อหน้า ก็ไม่ต้องแสดงอะไรเลย
  if (totalPages <= 1 && !showPageSize) return null

  const pages = visiblePages(page, totalPages)
  const firstPageHidden = pages[0] > 1
  const lastPageHidden = pages[pages.length - 1] < totalPages

  const summary =
    total !== undefined && pageSize
      ? `แสดง ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} จาก ${total} รายการ`
      : `หน้า ${page} จาก ${totalPages}`

  return (
    <div
      className={cn(
        "mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">{summary}</p>

        {showPageSize && (
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange?.(Number(value))}
          >
            <SelectTrigger size="sm" className="w-[110px]" aria-label="จำนวนต่อหน้า">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} ต่อหน้า
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center gap-2" aria-label="แบ่งหน้า">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">ก่อนหน้า</span>
          </Button>

          <div className="flex gap-1">
            {firstPageHidden && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-9"
                  onClick={() => onPageChange(1)}
                >
                  1
                </Button>
                {pages[0] > 2 && (
                  <span className="flex items-center px-1 text-muted-foreground">…</span>
                )}
              </>
            )}

            {pages.map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                className="w-9"
                aria-current={p === page ? "page" : undefined}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            ))}

            {lastPageHidden && (
              <>
                {pages[pages.length - 1] < totalPages - 1 && (
                  <span className="flex items-center px-1 text-muted-foreground">…</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-9"
                  onClick={() => onPageChange(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <span className="hidden sm:inline">ถัดไป</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>
      )}
    </div>
  )
}
