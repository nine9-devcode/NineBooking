// app/admin/(dashboard)/page.tsx

"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, RefreshCw, FileText } from "lucide-react"
import {
  StatsCards,
  YearlyChart,
  CategoryPieChart,
  RecentOrdersTable,
  TopProducts,
} from "@/features/dashboard/components"

export default function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setRefreshKey((prev) => prev + 1)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsRefreshing(false)
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm">ภาพรวมระบบจองสินค้า NineBooking</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-border text-foreground hover:bg-card hover:text-foreground"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            รีเฟรช
          </Button>

          <Button
            size="sm"
            asChild
            className="bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 text-foreground shadow-lg shadow-primary/20"
          >
            <Link href="/admin/report">
              <FileText className="w-4 h-4 mr-2" />
              สรุปรายงาน
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div key={`stats-${refreshKey}`}>
        <StatsCards />
      </div>

      {/* Yearly Chart */}
      <div key={`yearly-${refreshKey}`}>
        <YearlyChart />
      </div>

      {/* Category Pie + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div key={`category-${refreshKey}`}>
          <CategoryPieChart />
        </div>
        <div key={`recent-${refreshKey}`}>
          <RecentOrdersTable />
        </div>
      </div>

      {/* Top Products */}
      <div key={`top-${refreshKey}`}>
        <TopProducts />
      </div>
    </div>
  )
}
