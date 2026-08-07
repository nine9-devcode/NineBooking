// components/checkout/checkout-summary.tsx
// Sidebar แสดงสรุปรายการ + Submit Button

import { Button } from "@/components/ui/button"
import { GroupedItemsList } from "@/features/orders/components/grouped-items-list"
import { CheckCircle2, Loader2, Package, LinkIcon } from "lucide-react"
import { GroupedItem, CheckoutSummary as SummaryType } from "@/features/orders/checkout.types"

interface CheckoutSummaryProps {
  groupedItems: GroupedItem[]
  summary: SummaryType
  //onSubmit: () => void
  isLoading: boolean
}

export function CheckoutSummary({ groupedItems, summary, isLoading }: CheckoutSummaryProps) {
  return (
    <div className="lg:w-96">
      <div className="lg:sticky lg:top-24">
        <div className="bg-card rounded-xl border border-border p-6">
          {/* Header */}
          <h2 className="text-lg font-semibold text-foreground mb-4">สรุปรายการจอง</h2>

          {/* Items Preview */}
          <div className="max-h-80 overflow-y-auto mb-4 -mx-2 px-2">
            <GroupedItemsList items={groupedItems} compact />
          </div>

          {/* Stats */}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>จำนวนรายการ</span>
              <span className="font-medium">{summary.groupCount} รายการ</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Package className="w-4 h-4" />
                สินค้าหลัก
              </span>
              <span className="font-semibold text-primary">
                {summary.totalMainQuantity} ชิ้น
              </span>
            </div>
            {summary.totalPairedItems > 0 && (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 text-warning">
                  <LinkIcon className="w-4 h-4" />
                  สินค้าคู่ ({summary.totalPairedItems} รายการ)
                </span>
                <span className="font-medium text-warning">
                  {summary.totalPairedQuantity} ชิ้น
                </span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-foreground">รวมทั้งหมด</span>
              <span className="text-2xl font-bold text-primary">
                {summary.totalQuantity} ชิ้น
              </span>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground mb-4">
              * ระบบจองสินค้าไม่มีการชำระเงินออนไลน์
              <br />
              ทางร้านจะติดต่อกลับเพื่อยืนยันการจอง
            </p>

            {/* Submit Button (ซ่อนบน mobile เพราะมี sticky bar แล้ว) */}
            <div className="hidden lg:block">
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading || groupedItems.length === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    ยืนยันการจอง
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-info/10 border border-info/40 rounded-xl">
          <h4 className="text-sm font-semibold text-info mb-2">📋 ขั้นตอนหลังจากจอง</h4>
          <ol className="text-xs text-info space-y-1 list-decimal list-inside">
            <li>ระบบจะสร้างใบจองและแสดงหมายเลขอ้างอิง</li>
            <li>ทางบริษัทจะตรวจสอบและติดต่อกลับ</li>
            <li>เมื่อยืนยัน สถานะจะเปลี่ยนเป็น &quot;ยืนยันแล้ว&quot;</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
