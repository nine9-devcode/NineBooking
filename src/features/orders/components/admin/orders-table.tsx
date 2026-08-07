"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"
import { getMemberTypeLabel, MEMBER_TYPE_COLORS } from "@/lib/constants"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Loader2,
  Package,
  Eye,
  Calendar,
  Link2,
} from "lucide-react"
import type { OrderStatus } from "@prisma/client"
import { OrderStatusBadge } from "@/components/ui/status-badge"

interface PairedProduct {
  name: string
  image: string | null
  quantity: number
}

interface PreviewItem {
  productName: string
  productImage: string | null
  quantity: number
  pairedProducts?: PairedProduct[]
}

interface OrderPreview {
  id: string
  orderNumber: string
  status: string
  customer: {
    id: string
    name: string
    nickname?: string | null
    email: string
    phone: string
    image: string | null
    memberType?: string | null
    memberTypeNote?: string | null
    userDeleted?: boolean
  }
  itemCount: number
  totalQuantity: number
  previewItems: PreviewItem[]
  isNew?: boolean
  cancelledBy?: string | null
  createdAt: string
  updatedAt: string
}

interface OrdersTableProps {
  orders: OrderPreview[]
  loading: boolean
  emptyMessage?: string
}

function getMemberTypeBadgeVariant(memberType: string | null | undefined): "default" | "secondary" | "destructive" | "outline" {
  const variant = MEMBER_TYPE_COLORS[memberType || 'other']
  // เช็ค type safety ให้ตรงกับ shadcn badge variants
  if (variant === "default" || variant === "secondary" || variant === "destructive" || variant === "outline") {
    return variant
  }
  return "secondary"
}

export function OrdersTable({ orders, loading, emptyMessage }: OrdersTableProps) {
  // Loading state
  if (loading) {
    return (
      <div className="bg-card/50 rounded-xl border border-border">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="bg-card/50 rounded-xl border border-border">
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            ไม่พบคำสั่งจอง
          </h3>
          <p className="text-muted-foreground">
            {emptyMessage || "ยังไม่มีคำสั่งจองในระบบ"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-48 text-muted-foreground">เลขที่ใบจอง</TableHead>
                <TableHead className="hidden sm:table-cell text-muted-foreground">ลูกค้า</TableHead>
                <TableHead className="hidden md:table-cell w-64 text-muted-foreground">สินค้า</TableHead>
                <TableHead className="w-32 text-muted-foreground">สถานะ</TableHead>
                <TableHead className="hidden sm:table-cell w-40 text-muted-foreground">วันที่</TableHead>
                <TableHead className="w-24 text-center text-muted-foreground">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {

                return (
                  <TableRow
                    key={order.id}
                    className={`border-border hover:bg-secondary/50 ${
                      order.isNew ? "bg-warning/5 border-l-2 border-l-warning" : ""
                    }`}
                  >
                    {/* Order Number */}
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.itemCount} รายการ • {order.totalQuantity} ชิ้น
                        </p>
                      </div>
                    </TableCell>

                    {/* Customer */}
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        {order.customer.image ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary flex-shrink-0 mt-1">
                            <Image
                              src={order.customer.image}
                              alt={order.customer.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary border-2 border-primary flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-foreground font-semibold text-sm">
                              {order.customer.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                        )}

                        {/* User Info & Badges */}
                        <div className="min-w-0 flex-1">
                          {/* Row 1: Name + Nickname */}
                          <p className="font-medium text-foreground truncate text-sm">
                            {order.customer.name}
                            {order.customer.nickname && (
                              <span className="text-muted-foreground font-normal ml-1">
                                ({order.customer.nickname})
                              </span>
                            )}
                          </p>

                          {/* Row 2: Member Type Badge / Deleted Badge */}
                          <div className="flex items-center gap-1.5 mt-1">
                            {order.customer.userDeleted ? (
                              <Badge
                                variant="outline"
                                className="h-5 px-1.5 text-[10px] font-normal border-destructive/40 text-destructive bg-destructive/10"
                              >
                                บัญชีถูกลบแล้ว
                              </Badge>
                            ) : (
                              <>
                                <Badge
                                  variant={getMemberTypeBadgeVariant(order.customer.memberType)}
                                  className="h-5 px-1.5 text-[10px] capitalize font-normal border-opacity-50"
                                >
                                  {getMemberTypeLabel(order.customer.memberType ?? null)}
                                </Badge>

                                {order.customer.memberTypeNote && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help">
                                        <MessageSquare className="w-3.5 h-3.5 text-info/70 hover:text-info transition-colors" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-card border-border text-foreground max-w-[250px] break-words z-50">
                                      <p className="text-xs font-semibold mb-1 text-muted-foreground">หมายเหตุสมาชิก:</p>
                                      {order.customer.memberTypeNote}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </>
                            )}
                          </div>

                          {/* Row 3: Phone */}
                          <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
                            {order.customer.phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Products Preview */}
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1.5">
                        {order.previewItems.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            {/* รูปสินค้าหลัก */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative w-8 h-8 bg-secondary rounded overflow-hidden flex-shrink-0 cursor-pointer">
                                  {item.productImage ? (
                                    <Image
                                      src={item.productImage}
                                      alt={item.productName}
                                      fill
                                      className="object-cover"
                                      sizes="32px"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-card border-border">
                                <p>{item.productName}</p>
                              </TooltipContent>
                            </Tooltip>

                            {/* ชื่อสินค้า + จำนวน + สินค้าคู่ */}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-foreground truncate">
                                {item.productName}
                                <span className="text-muted-foreground ml-1">
                                  x{item.quantity}
                                </span>
                              </p>
                              
                              {/* สินค้าที่จับคู่ */}
                              {item.pairedProducts && item.pairedProducts.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Link2 className="w-3 h-3 text-primary flex-shrink-0" />
                                  <p className="text-xs text-muted-foreground truncate">
                                    คู่กับ: {item.pairedProducts.map(p => 
                                      `${p.name}${p.quantity > 1 ? ` x${p.quantity}` : ''}`
                                    ).join(", ")}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* แสดงจำนวนที่เหลือ */}
                        {order.previewItems.length > 2 && (
                          <p className="text-xs text-muted-foreground pl-10">
                            +{order.previewItems.length - 2} รายการเพิ่มเติม
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <OrderStatusBadge status={order.status as OrderStatus} />
                          {order.isNew && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-warning text-warning-foreground">
                              ใหม่
                            </span>
                          )}
                        </div>
                        {order.status === "CANCELLED" && order.cancelledBy && (
                          <span className="text-[10px] text-muted-foreground">
                            {order.cancelledBy === "CUSTOMER" ? "ยกเลิกโดยลูกค้า" : "ยกเลิกโดยแอดมิน"}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {new Date(order.createdAt).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground hover:bg-secondary">
                            <Eye className="w-4 h-4 mr-1" />
                            ดู
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  )
}