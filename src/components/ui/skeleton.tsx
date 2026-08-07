import { cn } from "@/lib/utils"

/** โครงร่างระหว่างรอข้อมูล — ใช้แทน spinner เมื่อรู้รูปร่างของสิ่งที่กำลังโหลดอยู่แล้ว */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

/** โครงร่างตาราง ใช้ในหน้า admin ที่ตอนนี้ตกไปเป็น spinner เปล่า */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="กำลังโหลดข้อมูล">
      <div className="flex gap-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-9 flex-1" />
        ))}
      </div>

      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-3">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={col} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
