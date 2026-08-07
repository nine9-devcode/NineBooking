import { cn } from "@/lib/utils"

/**
 * หัวเรื่องของหน้า พร้อมช่องสำหรับปุ่มด้านขวา
 *
 * ทุกหน้าใน /admin เคยเขียน <div className="space-y-6"><h1 className="text-3xl">
 * เองทีละหน้า แล้วขนาดก็ไม่ตรงกัน (บางหน้า text-3xl ตายตัว บางหน้า responsive)
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
