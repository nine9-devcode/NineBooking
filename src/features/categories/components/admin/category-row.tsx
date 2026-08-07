"use client"

import { format } from "date-fns"
import { th } from "date-fns/locale"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Edit,
  Trash2,
  MoreVertical,
  Package,
  FolderTree,
  ChevronRight,
  Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SortOrderInput } from "./sort-order-input"

interface PairedCategory {
  pairingId: string
  category: {
    id: string
    name: string
    slug: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  parentId: string | null
  sortOrder: number
  parent?: {
    id: string
    name: string
    slug: string
    sortOrder: number
  } | null
  children?: Category[]
  _count: {
    products: number
    children: number
  }
}

interface CategoryRowProps {
  category: Category
  pairings: PairedCategory[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onOpenPairing: (category: Category) => void
  onSortOrderChange: (categoryId: string, newSortOrder: number) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  isMoving?: boolean
  savingSort: boolean
  parentSortOrder?: number
  onToggleStatus?: (category: Category) => void
  togglingId?: string | null
}

export function CategoryRow({
  category,
  pairings,
  onEdit,
  onDelete,
  onOpenPairing,
  onSortOrderChange,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  isMoving = false,
  savingSort,
  parentSortOrder,
  onToggleStatus,
  togglingId = null,
}: CategoryRowProps) {
  const isChild = !!category.parentId
  const hasChildren = (category._count?.children ?? 0) > 0

  return (
    <TableRow
      className={cn(
        "border-border",
        isChild
          ? "hover:bg-background/50 border-l-2 border-l-primary/60"
          : "bg-card/50 hover:bg-card/70"
      )}
    >
      {/* ลำดับ */}
      <TableCell className="hidden md:table-cell w-28">
        <SortOrderInput
          value={category.sortOrder}
          onChange={(value) => onSortOrderChange(category.id, value)}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          isMoving={isMoving}
          disabled={savingSort}
          isChild={isChild}
          parentSortOrder={parentSortOrder}
        />
      </TableCell>

      {/* ชื่อหมวดหมู่ */}
      <TableCell>
        <div className={cn("flex items-start gap-2", isChild && "pl-6")}>
          {isChild ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
          ) : hasChildren ? (
            <FolderTree className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
          ) : (
            <Package className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
          )}
          <div>
            <p
              className={cn(
                isChild ? "text-foreground font-semibold" : "text-foreground font-bold"
              )}
            >
              {category.name}
            </p>
            <p className="text-sm text-muted-foreground">{category.slug}</p>
            {isChild && category.parent && (
              <Badge
                variant="outline"
                className="mt-1 text-xs border-border text-muted-foreground"
              >
                ภายใต้: {category.parent.name}
              </Badge>
            )}
          </div>
        </div>
      </TableCell>

      {/* คำอธิบาย */}
      <TableCell className="hidden md:table-cell">
        <p className="text-muted-foreground max-w-xs truncate">{category.description || "-"}</p>
      </TableCell>

      {/* จำนวนสินค้า */}
      <TableCell className="hidden sm:table-cell text-center">
        <Badge variant="outline" className="border-border text-foreground">
          {category._count.products} สินค้า
        </Badge>
      </TableCell>

      {/* จำนวนหมวดย่อย */}
      <TableCell className="hidden md:table-cell text-center">
        {!isChild && (category._count?.children ?? 0) > 0 ? (
          <Badge className="bg-info/10 text-info hover:bg-info/20">
            {category._count.children} หมวดย่อย
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* จับคู่กับ */}
      <TableCell className="hidden md:table-cell">
        {pairings.length === 0 ? (
          <span className="text-muted-foreground text-sm">ไม่มี</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {pairings.slice(0, 2).map((paired) => (
              <Tooltip key={paired.pairingId}>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className={cn(
                      "cursor-default",
                      isChild
                        ? "border-info/50 text-info bg-info/5"
                        : "border-primary/50 text-primary bg-primary/5"
                    )}
                  >
                    <Link2 className="w-3 h-3 mr-1" />
                    {paired.category.name}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-card border-border">
                  <p>จับคู่กับ: {paired.category.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {pairings.length > 2 && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className="border-border text-muted-foreground cursor-default"
                  >
                    +{pairings.length - 2}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-card border-border">
                  <div className="space-y-1">
                    {pairings.slice(2).map((paired) => (
                      <p key={paired.pairingId}>{paired.category.name}</p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </TableCell>

      {/* สถานะ - Switch Toggle */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Switch
            checked={category.isActive}
            onCheckedChange={() => onToggleStatus?.(category)}
            disabled={togglingId === category.id}
            className="data-[state=checked]:bg-success data-[state=unchecked]:bg-destructive/50"
          />
          <span
            className={cn(
              "text-xs font-medium min-w-[24px]",
              category.isActive ? "text-success" : "text-destructive"
            )}
          >
            {category.isActive ? "เปิด" : "ปิด"}
          </span>
        </div>
      </TableCell>

      {/* วันที่สร้าง */}
      <TableCell className="hidden md:table-cell">
        <p className="text-muted-foreground text-sm">
          {format(new Date(category.createdAt), "d MMM yyyy", {
            locale: th,
          })}
        </p>
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
              onClick={() => onEdit(category)}
              className="text-foreground hover:text-foreground hover:bg-card cursor-pointer"
            >
              <Edit className="w-4 h-4 mr-2" />
              แก้ไข
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onOpenPairing(category)}
              className="text-foreground hover:text-foreground hover:bg-card cursor-pointer"
            >
              <Link2 className="w-4 h-4 mr-2" />
              จับคู่หมวด
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-card" />

            <DropdownMenuItem
              onClick={() => onDelete(category)}
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
}
