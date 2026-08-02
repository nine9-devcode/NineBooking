// components/admin/contact-issues/contact-issues-table.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import Image from "next/image"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
  MessageSquare,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { getMemberTypeLabel, MEMBER_TYPE_COLORS } from "@/lib/constants"
import { getErrorMessage } from "@/lib/utils"

function getMemberTypeBadgeVariant(memberType: string | null | undefined): "default" | "secondary" | "destructive" | "outline" {
  const variant = MEMBER_TYPE_COLORS[memberType || "other"]
  if (variant === "default" || variant === "secondary" || variant === "destructive" || variant === "outline") {
    return variant
  }
  return "secondary"
}

interface ContactIssuesTableProps {
  data: any[]
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onRefresh: () => void
  selectedIds?: string[]
  onSelectIds?: (ids: string[]) => void
  isBulkDeleting?: boolean
}

export default function ContactIssuesTable({
  data,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onRefresh,
  selectedIds = [],
  onSelectIds,
  isBulkDeleting = false,
}: ContactIssuesTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const statusConfig = {
    PENDING: {
      label: "รอดำเนินการ",
      icon: AlertCircle,
      className: "bg-warning/10 text-warning border-warning/20"
    },
    IN_PROGRESS: {
      label: "กำลังดำเนินการ",
      icon: Clock,
      className: "bg-info/10 text-info border-info/20"
    },
    CLOSED: {
      label: "เสร็จสิ้น",
      icon: CheckCircle2,
      className: "bg-success/10 text-success border-success/20"
    },
  }

  const categoryConfig: Record<string, { label: string; className: string }> = {
    BOOKING: { label: "การจอง", className: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
    PAYMENT: { label: "การชำระเงิน", className: "bg-info/10 text-info border-info/20" },
    USAGE_ISSUE: { label: "ปัญหาการใช้งาน", className: "bg-destructive/10 text-destructive border-destructive/20" },
    ACCOUNT: { label: "บัญชีผู้ใช้", className: "bg-info/10 text-info border-info/20" },
    OTHER: { label: "อื่นๆ", className: "bg-secondary/10 text-muted-foreground border-border" },
  }

  const handleView = (id: string) => {
    router.push(`/admin/contact-issues/${id}`)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/admin/contact-issues/${deleteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "ไม่สามารถลบได้")
      }

      toast.success("ลบรายการสำเร็จ")
      onRefresh()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (onSelectIds) {
      if (checked) {
        onSelectIds(data.map((issue) => issue.id))
      } else {
        onSelectIds([])
      }
    }
  }

  const handleSelectSingle = (issueId: string, checked: boolean) => {
    if (onSelectIds) {
      if (checked) {
        onSelectIds([...selectedIds, issueId])
      } else {
        onSelectIds(selectedIds.filter((id) => id !== issueId))
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">ไม่พบรายการแจ้งปัญหา</p>
      </div>
    )
  }

  const showOverlay = isDeleting || isBulkDeleting

  return (
    <>
      <div className="relative rounded-lg border border-border overflow-hidden">
        {/* Delete Overlay */}
        {showOverlay && (
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
            <TableRow className="bg-card border-border hover:bg-card">
              {onSelectIds && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === data.length && data.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </TableHead>
              )}
              <TableHead className="text-foreground font-semibold">เลขที่แจ้ง</TableHead>
              <TableHead className="hidden sm:table-cell text-foreground font-semibold">สมาชิก</TableHead>
              <TableHead className="hidden md:table-cell text-foreground font-semibold">ประเภท</TableHead>
              <TableHead className="hidden sm:table-cell text-foreground font-semibold">หัวข้อ</TableHead>
              <TableHead className="hidden md:table-cell text-foreground font-semibold">วันที่แจ้ง</TableHead>
              <TableHead className="text-foreground font-semibold">สถานะ</TableHead>
              <TableHead className="text-foreground font-semibold text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((issue) => {
              const statusInfo = statusConfig[issue.status as keyof typeof statusConfig] || {
                label: issue.status,
                icon: AlertCircle,
                className: "bg-card text-muted-foreground border-border"
              }
              const StatusIcon = statusInfo.icon
              
              return (
                <TableRow
                  key={issue.id}
                  className={`border-border hover:bg-card/50 transition-colors ${
                    selectedIds.includes(issue.id)
                      ? "bg-primary/5"
                      : issue.isNew
                      ? "bg-warning/5 border-l-2 border-l-amber-400"
                      : ""
                  }`}
                >
                  {onSelectIds && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(issue.id)}
                        onCheckedChange={(checked) => handleSelectSingle(issue.id, checked as boolean)}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </TableCell>
                  )}
                  
                  <TableCell className="font-mono text-primary">
                    <div className="flex items-center gap-1.5">
                      {issue.issueNumber}
                      {issue.isNew && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-warning text-foreground">
                          ใหม่
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      {issue.user?.image ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary flex-shrink-0 mt-1">
                          <Image
                            src={issue.user.image}
                            alt={issue.user.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary border-2 border-primary flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-foreground font-semibold text-sm">
                            {issue.user?.name?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                      )}

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        {/* Name + Nickname */}
                        <p className="font-medium text-foreground truncate text-sm">
                          {issue.user?.name || "ไม่ระบุชื่อ"}
                          {issue.user?.nickname && (
                            <span className="text-muted-foreground font-normal ml-1">
                              ({issue.user.nickname})
                            </span>
                          )}
                        </p>

                        {/* Member Type Badge / Deleted Badge */}
                        <div className="flex items-center gap-1.5 mt-1">
                          {!issue.user ? (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal border-destructive/40 text-destructive bg-destructive/10">
                              บัญชีถูกลบแล้ว
                            </Badge>
                          ) : (
                            <>
                              <Badge
                                variant={getMemberTypeBadgeVariant(issue.user.memberType)}
                                className="h-5 px-1.5 text-[10px] capitalize font-normal border-opacity-50"
                              >
                                {getMemberTypeLabel(issue.user.memberType ?? null)}
                              </Badge>
                              {issue.user.memberTypeNote && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-help">
                                      <MessageSquare className="w-3.5 h-3.5 text-info/70 hover:text-info transition-colors" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-card border-border text-foreground max-w-[250px] break-words z-50">
                                    <p className="text-xs font-semibold mb-1 text-muted-foreground">หมายเหตุสมาชิก:</p>
                                    {issue.user.memberTypeNote}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </>
                          )}
                        </div>

                        {/* Phone */}
                        <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
                          {issue.user?.phone || "-"}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    {issue.category && categoryConfig[issue.category] ? (
                      <Badge
                        variant="outline"
                        className={`${categoryConfig[issue.category].className} text-xs`}
                      >
                        {categoryConfig[issue.category].label}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    <p className="text-foreground line-clamp-2 max-w-md">
                      {issue.subject}
                    </p>
                  </TableCell>

                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {format(new Date(issue.createdAt), "d MMM yyyy HH:mm", { locale: th })}
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${statusInfo.className} flex items-center gap-1 w-fit`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(issue.id)}
                        className="text-info hover:text-info hover:bg-info"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        ดู
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(issue.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            หน้า {page} จาก {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="border-border text-foreground hover:bg-card disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              ก่อนหน้า
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="border-border text-foreground hover:bg-card disabled:opacity-50"
            >
              ถัดไป
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Single Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              คุณแน่ใจหรือไม่ว่าต้องการลบรายการแจ้งปัญหานี้? 
              การกระทำนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-card text-foreground hover:bg-secondary border-border"
              disabled={isDeleting}
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}