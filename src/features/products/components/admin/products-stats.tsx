"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Package, Check, X } from "lucide-react"

interface ProductsStatsProps {
  total: number
  active: number
  inactive: number
}

export function ProductsStats({ total, active, inactive }: ProductsStatsProps) {
  const stats = [
    {
      title: "สินค้าทั้งหมด",
      value: total,
      icon: Package,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "สินค้าเปิดใช้งาน",
      value: active,
      icon: Check,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "สินค้าปิดใช้งาน",
      value: inactive,
      icon: X,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="bg-background border-border hover:border-border transition-colors"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}