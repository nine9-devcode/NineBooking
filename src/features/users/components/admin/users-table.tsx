// components/admin/users/users-table.tsx
"use client"

import Image from "next/image"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Edit, Trash2, Calendar, ShoppingBag, Users, MessageSquare, AlertCircle } from "lucide-react"
import { DataPagination } from "@/components/ui/data-pagination"
import { getResidenceTypeLabel, getMemberTypeLabel, MEMBER_TYPE_COLORS } from "@/lib/constants"

interface UserData {
  id: string
  name: string | null
  nickname: string | null
  email: string | null
  phone: string | null
  role: string
  image: string | null
  residenceType: string | null
  memberType?: string | null
  memberTypeNote?: string | null
  isProfileCompleted?: boolean
  createdAt: string
  _count?: {
    orders: number
    contactIssues: number
  }
}

interface UsersTableProps {
  data: UserData[]
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onRefresh: () => void
  onEdit: (user: UserData) => void
  onDelete: (user: UserData) => void
}

// Helper: แปลง memberType เป็น variant ที่ถูกต้อง
function getMemberTypeBadgeVariant(memberType: string | null | undefined): "default" | "secondary" | "destructive" | "outline" {
  const variant = MEMBER_TYPE_COLORS[memberType || 'other']
  if (variant === "default" || variant === "secondary" || variant === "destructive" || variant === "outline") {
    return variant
  }
  return "secondary" // fallback
}

// Loading Skeleton Component
function TableSkeleton() {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">สมาชิก</TableHead>
            <TableHead className="text-muted-foreground">ข้อมูลเพิ่มเติม</TableHead>
            <TableHead className="text-muted-foreground">ติดต่อ</TableHead>
            <TableHead className="text-muted-foreground">ประเภทสมาชิก</TableHead>
            <TableHead className="text-muted-foreground">สถิติ</TableHead>
            <TableHead className="text-muted-foreground">บทบาท</TableHead>
            <TableHead className="text-muted-foreground text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i} className="border-border">
              <TableCell colSpan={7}>
                <div className="h-16 bg-card/50 animate-pulse rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function UsersTable({
  data,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onRefresh,
  onEdit,
  onDelete
}: UsersTableProps) {
  // Loading state
  if (isLoading) {
    return <TableSkeleton />
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="rounded-md border border-border p-12 text-center">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          ไม่พบข้อมูลสมาชิก
        </h3>
        <p className="text-sm text-muted-foreground">
          ลองเปลี่ยนคำค้นหาหรือตัวกรอง
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">สมาชิก</TableHead>
              <TableHead className="hidden md:table-cell text-muted-foreground">ข้อมูลเพิ่มเติม</TableHead>
              <TableHead className="hidden sm:table-cell text-muted-foreground">ติดต่อ</TableHead>
              <TableHead className="hidden md:table-cell text-muted-foreground">ประเภทสมาชิก</TableHead>
              <TableHead className="hidden md:table-cell text-muted-foreground">สถิติ</TableHead>
              <TableHead className="hidden sm:table-cell text-muted-foreground">บทบาท</TableHead>
              <TableHead className="text-muted-foreground text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((user) => {
              const orderCount = user._count?.orders || 0
              const isProfileComplete = user.isProfileCompleted ?? true

              return (
                <TableRow key={user.id} className="border-border">
                  {/* สมาชิก (ชื่อ + อีเมล + วันที่สมัคร) */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        {user.image ? (
                          <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-primary flex-shrink-0">
                            <Image
                              src={user.image}
                              alt={user.name || "User"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary border-2 border-primary flex items-center justify-center flex-shrink-0">
                            <span className="text-foreground font-semibold text-sm">
                              {user.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                        )}
                        
                        {/* Badge สถานะ profile */}
                        {!isProfileComplete && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-warning rounded-full flex items-center justify-center border-2 border-border cursor-help">
                                  <AlertCircle className="w-2.5 h-2.5 text-foreground" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                ข้อมูลไม่สมบูรณ์
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground truncate">
                            {user.name || "ไม่ระบุชื่อ"}
                          </span>
                          {/* Badge ข้อมูลไม่สมบูรณ์ */}
                          {!isProfileComplete && (
                            <Badge 
                              variant="outline" 
                              className="text-[10px] px-1.5 py-0 h-4 bg-warning/10 text-warning border-warning/30"
                            >
                              ไม่สมบูรณ์
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.createdAt).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* ข้อมูลเพิ่มเติม (ชื่อเล่น + ประเภทที่พัก) */}
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-1">
                      <div className="text-sm text-foreground">
                        {user.nickname || "-"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.residenceType
                          ? getResidenceTypeLabel(user.residenceType)
                          : "-"}
                      </div>
                    </div>
                  </TableCell>

                  {/* ติดต่อ (เบอร์โทร) */}
                  <TableCell className="hidden sm:table-cell text-foreground">
                    {user.phone || "-"}
                  </TableCell>

                  {/* ประเภทสมาชิก + หมายเหตุ */}
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-1.5 max-w-[200px]">
                      {user.role === "admin" ? (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                          ผู้ดูแลระบบ
                        </Badge>
                      ) : (
                        <>
                          {/* Badge ประเภทสมาชิก */}
                          <Badge
                            variant={getMemberTypeBadgeVariant(user.memberType)}
                            className="capitalize"
                          >
                            {getMemberTypeLabel(user.memberType ?? null)}
                          </Badge>

                          {/* แสดงหมายเหตุแบบจำกัด 15 ตัวอักษร พร้อม Tooltip ดูข้อความเต็ม */}
                          {user.memberTypeNote && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-start gap-1.5 cursor-help">
                                    <MessageSquare className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-muted-foreground leading-tight">
                                      {user.memberTypeNote.length > 15
                                        ? `${user.memberTypeNote.substring(0, 15)}...`
                                        : user.memberTypeNote}
                                    </p>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-card border-border text-foreground max-w-[250px] break-words">
                                  {user.memberTypeNote}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>

                  {/* สถิติ (จำนวนจอง) */}
                  <TableCell className="hidden md:table-cell">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className={`flex items-center gap-1.5 w-fit cursor-help ${
                              orderCount > 0
                                ? "bg-info/10 text-info hover:bg-info/40"
                                : "bg-card text-muted-foreground hover:bg-card"
                            }`}
                          >
                            <ShoppingBag className="h-3 w-3" />
                            {orderCount}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {orderCount > 0
                            ? `จองแล้ว ${orderCount} ครั้ง`
                            : "ยังไม่เคยจอง"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  {/* บทบาท */}
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                    >
                      {user.role === "admin" ? "Admin" : "User"}
                    </Badge>
                  </TableCell>

                  {/* จัดการ */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-info hover:bg-info/20"
                              onClick={() => onEdit(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>แก้ไขข้อมูล</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/20"
                              onClick={() => onDelete(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>ลบสมาชิก</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <DataPagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
