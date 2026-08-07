import { Skeleton, TableSkeleton } from "@/components/ui/skeleton"

/** โครงร่างระหว่างรอหน้า admin — ดีกว่าจอว่างเปล่าตอนสลับเมนู */
export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <TableSkeleton />
    </div>
  )
}
