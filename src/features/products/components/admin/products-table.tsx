"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Trash2, MoreVertical, Package, Link2, Layers, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  subtitle: string | null
  slug: string
  description: string | null
  image: string | null
  images: string[]
  datasheets: any | null
  isActive: boolean
  categoryId: string
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    slug: string
  }
  showCategoryPairings?: boolean
  _count: {
    orderItems: number
    exclusivePairingsA?: number
    exclusivePairingsB?: number
  }
}

interface ProductsTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onExclusivePairing?: (product: Product) => void
  onToggleStatus?: (product: Product) => void
  isDeleting?: boolean
  togglingId?: string | null
}

export function ProductsTable({
  products,
  onEdit,
  onDelete,
  onExclusivePairing,
  onToggleStatus,
  isDeleting = false,
  togglingId = null,
}: ProductsTableProps) {
  // Helper: นับจำนวน Exclusive Pairings
  const getExclusiveCount = (product: Product) => {
    const countA = product._count?.exclusivePairingsA || 0
    const countB = product._count?.exclusivePairingsB || 0
    return countA + countB
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="w-16 h-16 text-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">ยังไม่มีสินค้า</h3>
        <p className="text-muted-foreground mb-4">เริ่มต้นเพิ่มสินค้าแรกของคุณ</p>
      </div>
    )
  }

  return (
    <div className="relative border border-border rounded-lg overflow-hidden">
      {/* Delete Overlay */}
      {isDeleting && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-destructive animate-spin" />
            <p className="text-sm text-foreground font-medium">กำลังลบข้อมูล...</p>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-background hover:bg-background">
              <TableHead className="text-muted-foreground">รูป</TableHead>
              <TableHead className="text-muted-foreground">ชื่อสินค้า</TableHead>
              <TableHead className="hidden md:table-cell text-muted-foreground">
                หมวดหมู่
              </TableHead>
              <TableHead className="hidden sm:table-cell text-muted-foreground text-center">
                สถานะ
              </TableHead>
              <TableHead className="text-muted-foreground text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const exclusiveCount = getExclusiveCount(product)
              const hasExclusive = exclusiveCount > 0

              return (
                <TableRow key={product.id} className="border-border hover:bg-background/50">
                  {/* รูปภาพ */}
                  <TableCell>
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-card rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>

                  {/* ชื่อสินค้า + Subtitle + Slug + Exclusive Badge */}
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{product.name}</p>
                        {hasExclusive && (
                          <Badge className="bg-chart-4/10 text-chart-4 hover:bg-chart-4/20 text-xs">
                            <Link2 className="w-3 h-3 mr-1" />
                            {exclusiveCount}
                          </Badge>
                        )}
                        {hasExclusive && product.showCategoryPairings && (
                          <Badge
                            className="bg-info/10 text-info hover:bg-info/20 text-xs"
                            title="แสดงสินค้าหมวดร่วมด้วย"
                          >
                            <Layers className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                      {product.subtitle && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {product.subtitle}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{product.slug}</p>
                    </div>
                  </TableCell>

                  {/* หมวดหมู่ */}
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="border-border text-foreground">
                      {product.category.name}
                    </Badge>
                  </TableCell>

                  {/* สถานะ */}
                  <TableCell className="hidden sm:table-cell text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={product.isActive}
                        onCheckedChange={() => onToggleStatus?.(product)}
                        disabled={togglingId === product.id}
                        className="data-[state=checked]:bg-success data-[state=unchecked]:bg-destructive/50"
                      />
                      <span
                        className={cn(
                          "text-xs font-medium min-w-[24px]",
                          product.isActive ? "text-success" : "text-destructive"
                        )}
                      >
                        {product.isActive ? "เปิด" : "ปิด"}
                      </span>
                    </div>
                  </TableCell>

                  {/* จัดการ */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-card"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border-border">
                        <DropdownMenuItem
                          onClick={() => onEdit(product)}
                          className="text-foreground hover:text-foreground hover:bg-card cursor-pointer"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          แก้ไข
                        </DropdownMenuItem>

                        {/* ปุ่มจับคู่ */}
                        {onExclusivePairing && (
                          <DropdownMenuItem
                            onClick={() => onExclusivePairing(product)}
                            className="text-chart-4 hover:text-chart-4 hover:bg-chart-4/10 cursor-pointer"
                          >
                            <Link2 className="w-4 h-4 mr-2" />
                            จับคู่เฉพาะ
                            {hasExclusive && (
                              <span className="ml-auto text-xs bg-chart-4/10 px-1.5 py-0.5 rounded">
                                {exclusiveCount}
                              </span>
                            )}
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="bg-card" />

                        <DropdownMenuItem
                          onClick={() => onDelete(product)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          ลบ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
