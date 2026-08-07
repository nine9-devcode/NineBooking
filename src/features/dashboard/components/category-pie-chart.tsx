// ไฟล์: components/admin/dashboard/category-pie-chart.tsx

"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { PieChart as PieChartIcon } from "lucide-react"
import { chartTheme, chartTooltipStyle } from "@/config/chart-theme"

interface CategoryStat {
  categoryId: string
  categoryName: string
  orderCount: number
  viewCount: number
  orderPercentage: number
  viewPercentage: number
}

interface CategoryStats {
  topCategories: CategoryStat[]
  totalOrders: number
  totalViews: number
}

// สองแท็บใช้คนละชุดสีเพื่อให้แยกออกว่ากำลังดูอะไรอยู่
// ยอดจอง = ไล่เฉดน้ำเงินหลัก / ยอดเข้าชม = สีชุดของกราฟ
const ORDER_COLORS = chartTheme.ramp.map((main, i) => ({
  main,
  light: chartTheme.ramp[Math.max(0, i - 1)],
}))

const VIEW_COLORS = chartTheme.series.map((main) => ({ main, light: main }))

export function CategoryPieChart() {
  const [stats, setStats] = useState<CategoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"orders" | "views">("orders")

  useEffect(() => {
    const fetchCategoryStats = async () => {
      try {
        const response = await fetch("/api/admin/dashboard/category-stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching category stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryStats()
  }, [])

  const COLORS = activeTab === "orders" ? ORDER_COLORS : VIEW_COLORS

  if (loading) {
    return (
      <div className="bg-background rounded-xl p-6 border border-border">
        <div className="h-4 bg-card rounded w-1/2 mb-6"></div>
        <div className="h-64 bg-card/50 rounded-lg animate-pulse"></div>
      </div>
    )
  }

  if (!stats || stats.topCategories.length === 0) {
    return (
      <div className="bg-background rounded-xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-chart-4/10 rounded-lg">
            <PieChartIcon className="w-5 h-5 text-chart-4" />
          </div>
          <h2 className="text-lg font-bold text-foreground">สัดส่วนหมวดหมู่</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <PieChartIcon className="w-12 h-12 text-foreground mb-3" />
          <p className="text-muted-foreground">ยังไม่มีข้อมูล</p>
          <p className="text-muted-foreground text-sm mt-1">
            ข้อมูลจะแสดงเมื่อมียอดจองหรือยอดเข้าชม
          </p>
        </div>
      </div>
    )
  }

  const chartData = stats.topCategories.map((cat) => ({
    name: cat.categoryName,
    value: activeTab === "orders" ? cat.orderCount : cat.viewCount,
    percentage: activeTab === "orders" ? cat.orderPercentage : cat.viewPercentage,
  }))

  return (
    <div className="bg-background rounded-xl p-6 border border-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${activeTab === "orders" ? "bg-primary/10" : "bg-info/10"}`}
          >
            <PieChartIcon
              className={`w-5 h-5 ${activeTab === "orders" ? "text-primary" : "text-info"}`}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">สัดส่วนหมวดหมู่</h2>
            <p className="text-sm text-muted-foreground">
              Top 5 หมวดหมู่ {activeTab === "orders" ? "(นับตามใบจอง)" : ""}
            </p>
          </div>
        </div>

        {/* Tab Switch */}
        <div className="flex bg-card rounded-lg p-1">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "orders"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ยอดจอง
          </button>
          <button
            onClick={() => setActiveTab("views")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "views"
                ? "bg-info text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ยอดเข้าชม
          </button>
        </div>
      </div>

      {/* Chart & Legend */}
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Pie Chart */}
        <div className="w-full lg:w-1/2">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length].main}
                    stroke={COLORS[index % COLORS.length].light}
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={chartTooltipStyle}
                itemStyle={{ color: chartTheme.tooltipText }}
                formatter={(value: any, name: any, props: any) => [
                  `${value.toLocaleString()} ${activeTab === "orders" ? "ใบจอง" : "ครั้ง"} (${props.payload.percentage.toFixed(1)}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full lg:w-1/2 space-y-2">
          {chartData.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg bg-card/50 hover:bg-card transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length].main }}
                />
                <span className="text-sm text-foreground truncate max-w-[120px]">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {item.value.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-1">ใบจองทั้งหมด</p>
            <p className="text-xl font-bold text-primary">
              {stats.totalOrders.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-1">ยอดเข้าชมทั้งหมด</p>
            <p className="text-xl font-bold text-info">{stats.totalViews.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
