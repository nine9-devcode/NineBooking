// components/admin/quotations/quotations-table.tsx

"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Loader2,
  FileText,
  User,
  Calendar,
  Eye,
  Download,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  MessageSquare,
  ArrowRight,
} from "lucide-react"
import { QuotationPreview } from "./types"
import { getQuotationStatusConfig, formatCurrency } from "./constants"
import { getMemberTypeLabel, MEMBER_TYPE_COLORS } from "@/lib/constants"

interface QuotationsTableProps {
  quotations: QuotationPreview[]
  loading: boolean
  emptyMessage?: string
  onDelete?: (id: string) => void
}

// Helper: เลือกสี Badge
function getMemberTypeBadgeVariant(memberType: string | null | undefined): "default" | "secondary" | "destructive" | "outline" {
  const variant = MEMBER_TYPE_COLORS[memberType || 'other']
  if (variant === "default" || variant === "secondary" || variant === "destructive" || variant === "outline") {
    return variant
  }
  return "secondary"
}

// Helper: Format date สั้น
function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  })
}

export function QuotationsTable({ quotations, loading, emptyMessage, onDelete }: QuotationsTableProps) {
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
  if (quotations.length === 0) {
    return (
      <div className="bg-card/50 rounded-xl border border-border">
        <div className="text-center py-20">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            ไม่พบใบเสนอราคา
          </h3>
          <p className="text-muted-foreground">
            {emptyMessage || "ยังไม่มีใบเสนอราคาในระบบ"}
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
                <TableHead className="w-44 text-muted-foreground">เลขที่</TableHead>
                <TableHead className="hidden sm:table-cell text-muted-foreground">ลูกค้า</TableHead>
                <TableHead className="hidden md:table-cell w-32 text-muted-foreground">อ้างอิง</TableHead>
                <TableHead className="hidden sm:table-cell w-28 text-right text-muted-foreground">ยอดรวม</TableHead>
                <TableHead className="w-28 text-muted-foreground">สถานะ</TableHead>
                <TableHead className="hidden md:table-cell w-44 text-muted-foreground">ระยะเวลา</TableHead>
                <TableHead className="w-24 text-center text-muted-foreground">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.map((quotation) => {
                const statusConfig = getQuotationStatusConfig(quotation.status)
                const StatusIcon = statusConfig.icon
                const isExpired = new Date(quotation.validUntil) < new Date()

                return (
                  <TableRow key={quotation.id} className="border-border hover:bg-secondary/50">
                    {/* Quotation Number */}
                    <TableCell>
                      <Link
                        href={`/admin/quotations/${quotation.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-foreground hover:text-primary">
                              {quotation.quotationNumber}
                            </p>
                            {quotation.version > 1 && (
                              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                V{quotation.version}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {quotation.itemCount} รายการ
                          </p>
                        </div>
                      </Link>
                    </TableCell>

                    {/* Customer */}
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        {quotation.customer.image ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary flex-shrink-0 mt-1">
                            <Image
                              src={quotation.customer.image}
                              alt={quotation.customer.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary border-2 border-primary flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-foreground font-semibold text-sm">
                              {quotation.customer.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                        )}

                        {/* User Info & Badges */}
                        <div className="min-w-0 flex-1">
                          {/* Row 1: Name + Nickname */}
                          <p className="font-medium text-foreground truncate text-sm">
                            {quotation.customer.name}
                            {quotation.customer.nickname && (
                              <span className="text-muted-foreground font-normal ml-1">
                                ({quotation.customer.nickname})
                              </span>
                            )}
                          </p>

                          {/* Row 2: Member Type Badge + Note */}
                          <div className="flex items-center gap-1.5 mt-1">
                            {quotation.customer.userDeleted ? (
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal border-destructive/40 text-destructive bg-destructive/10">
                                บัญชีถูกลบแล้ว
                              </Badge>
                            ) : (
                              <>
                                <Badge
                                  variant={getMemberTypeBadgeVariant(quotation.customer.memberType)}
                                  className="h-5 px-1.5 text-[10px] capitalize font-normal border-opacity-50"
                                >
                                  {getMemberTypeLabel(quotation.customer.memberType ?? null)}
                                </Badge>

                                {/* Note with Tooltip */}
                                {quotation.customer.memberTypeNote && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help">
                                        <MessageSquare className="w-3.5 h-3.5 text-info/70 hover:text-info transition-colors" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-card border-border text-foreground max-w-[250px] break-words z-50">
                                      <p className="text-xs font-semibold mb-1 text-muted-foreground">หมายเหตุสมาชิก:</p>
                                      {quotation.customer.memberTypeNote}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </>
                            )}
                          </div>

                          {/* Row 3: Phone */}
                          <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
                            {quotation.customer.phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Order Reference */}
                    <TableCell className="hidden md:table-cell">
                      <Link
                        href={`/admin/orders/${quotation.orderId}`}
                        className="text-primary hover:underline text-sm"
                      >
                        {quotation.orderNumber}
                      </Link>
                    </TableCell>

                    {/* Total Amount */}
                    <TableCell className="hidden sm:table-cell text-right">
                      <div>
                        <p className="text-foreground font-medium">
                          {formatCurrency(quotation.totalAmount)}
                        </p>
                        {quotation.includeVat && (
                          <p className="text-xs text-muted-foreground">รวม VAT</p>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.darkColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </TableCell>

                    {/* ระยะเวลา */}
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground">
                          {formatShortDate(quotation.createdAt)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className={isExpired ? "text-destructive" : "text-foreground"}>
                          {formatShortDate(quotation.validUntil)}
                        </span>
                        {isExpired && quotation.status !== "EXPIRED" && (
                          <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded ml-1">
                            หมดอายุ
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {/* ปุ่มดู/แก้ไข */}
                        <Link href={`/admin/quotations/${quotation.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-foreground hover:text-foreground hover:bg-secondary"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            ดู
                          </Button>
                        </Link>

                        {/* Dropdown Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-foreground hover:text-foreground hover:bg-secondary px-2"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border-border">
                            <DropdownMenuItem
                              onClick={() => window.open(`/api/admin/quotations/${quotation.id}/pdf`, "_blank")}
                              className="text-foreground hover:bg-secondary cursor-pointer"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              ดาวน์โหลด PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/orders/${quotation.orderId}`}
                                className="flex items-center text-foreground hover:bg-secondary cursor-pointer"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                ดูคำสั่งจอง
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-card" />
                            <DropdownMenuItem
                              onClick={() => onDelete?.(quotation.id)}
                              className="text-destructive hover:bg-destructive/20 hover:text-destructive cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              ลบ
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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