// components/admin/report/tabs/products-tab.tsx

import { ShoppingCart, Eye } from 'lucide-react';
import type { ReportData } from '@/features/dashboard/summary-report.types';

interface ProductsTabProps {
  reportData: ReportData;
}

export function ProductsTab({ reportData }: ProductsTabProps) {
  return (
    <div className="space-y-6">
      {/* Category Stats */}
      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">วิเคราะห์ตามหมวดหมู่สินค้า (Top 5)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card/50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">#</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">หมวดหมู่</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">จำนวนจอง</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">% จากคำสั่งจอง</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">ยอดเข้าชม</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">% จากยอดชม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reportData.categoryStats && reportData.categoryStats.length > 0 ? (
                reportData.categoryStats.map((cat, index) => (
                  <tr key={index} className="hover:bg-card/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">{cat.categoryName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-primary font-semibold">{cat.orderCount.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{cat.orderPercentage}%</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-info font-semibold">{cat.viewCount.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{cat.viewPercentage}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">ไม่พบข้อมูลหมวดหมู่</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-background border border-border rounded-xl p-4">
          <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            สินค้าที่ถูกจองมากที่สุด
          </h3>
          <div className="space-y-2">
            {reportData.topProductsByOrders && reportData.topProductsByOrders.length > 0 ? (
              reportData.topProductsByOrders.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
                    <span className="text-sm text-foreground">{product.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">{product.orderCount?.toLocaleString()} รายการ</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">ไม่พบข้อมูล</p>
            )}
          </div>
        </div>

        <div className="bg-background border border-border rounded-xl p-4">
          <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-info" />
            สินค้าที่ได้รับความสนใจสูงสุด
          </h3>
          <div className="space-y-2">
            {reportData.topProductsByViews && reportData.topProductsByViews.length > 0 ? (
              reportData.topProductsByViews.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
                    <span className="text-sm text-foreground">{product.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-info">{product.viewCount?.toLocaleString()} ครั้ง</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">ไม่พบข้อมูล</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
