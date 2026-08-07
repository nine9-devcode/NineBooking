// app/admin/(dashboard)/users/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { UsersStats } from "@/features/users/components/admin/users-stats"
import { UsersTable } from "@/features/users/components/admin/users-table"
import { UsersSearch } from "@/features/users/components/admin/users-search"
import { EditUserModal } from "@/features/users/components/admin/edit-user-modal"
import { EditAdminModal } from "@/features/users/components/admin/edit-admin-modal"
import { DeleteUserDialog } from "@/features/users/components/admin/delete-user-dialog"
import { CreateAdminModal } from "@/features/users/components/admin/create-admin-modal"
import { ExportButtons } from "@/features/dashboard/components/export-buttons"
import { toast } from "sonner"
import { RefreshCw, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getErrorMessage } from "@/lib/utils"

interface UserStats {
  total: number
  users: number
  admins: number
  newToday: number
  byType?: {
    customer: number
    contractor: number
    dealer: number
    other: number
  }
}

export default function MembersPage() {
  // Data State
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    users: 0,
    admins: 0,
    newToday: 0,
    byType: {
      customer: 0,
      contractor: 0,
      dealer: 0,
      other: 0,
    },
  })
  const [loading, setLoading] = useState(true)

  // Filter & Pagination State
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("")
  const [memberType, setMemberType] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false)

  // Build filter params for export
  const buildFilterParams = () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (role) params.set("role", role)
    if (memberType !== "all") params.set("memberType", memberType)
    return params.toString()
  }

  // Fetch Users List
  const fetchUsers = useCallback(
    async (isRefresh = false) => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          search,
          role,
          page: page.toString(),
          limit: limit.toString(),
        })

        if (memberType !== "all") {
          params.set("memberType", memberType)
        }

        const response = await fetch(`/api/admin/users?${params}`)
        const data = await response.json()

        if (!response.ok) throw new Error(data.error || "เกิดข้อผิดพลาด")

        setUsers(data.users)
        setTotalPages(data.pagination.totalPages)

        if (data.stats) {
          setStats(data.stats)
        }

        if (isRefresh) {
          toast.success("รีเฟรชข้อมูลสำเร็จ")
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error))
      } finally {
        setLoading(false)
      }
    },
    [search, role, memberType, page]
  )

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Handle Edit Click - Fetch full user data
  const handleEditClick = async (user: any) => {
    setSelectedUser(user)
    if (user.role === "admin") {
      setIsEditAdminModalOpen(true)
    } else {
      setIsEditModalOpen(true)
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`)

      if (res.ok) {
        const data = await res.json()
        const fullUserData = data.user || data
        setSelectedUser(fullUserData)
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "ไม่สามารถดึงข้อมูลรายละเอียดได้")
      }
    } catch (error) {
      console.error("Error fetching details:", error)
      toast.error("ไม่สามารถดึงข้อมูลรายละเอียดได้")
    }
  }

  // Handle Save User
  const handleSaveUser = async (formData: any) => {
    try {
      setIsSaving(true)

      const dataToSend = {
        name: formData.name,
        nickname: formData.nickname || null,
        phone: formData.phone || null,
        memberType: formData.memberType,
        memberTypeNote: formData.memberTypeNote || null,
        residenceType: formData.residenceType,
        address: formData.address || null,
        province: formData.province || null,
        district: formData.district || null,
        subDistrict: formData.subDistrict || null,
        postalCode: formData.postalCode || null,
      }

      const response = await fetch(`/api/admin/users/${formData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "ไม่สามารถบันทึกข้อมูลได้")
      }

      toast.success(result.message || "บันทึกข้อมูลเรียบร้อยแล้ว")
      setIsEditModalOpen(false)
      fetchUsers()
    } catch (error: unknown) {
      console.error("Error saving user:", error)
      toast.error(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Delete Click
  const handleDeleteClick = (user: any) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  // Handle Delete Success
  const handleDeleteSuccess = () => {
    fetchUsers()
  }

  // Handle Refresh
  const handleRefresh = () => {
    fetchUsers(true)
  }

  return (
    <div className="flex-col">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">จัดการสมาชิก</h1>
            <p className="text-sm text-muted-foreground">
              ดูและจัดการข้อมูลสมาชิก บทบาท และตรวจสอบประวัติการจอง
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ExportButtons
              baseUrl="/api/admin/users"
              filterParams={buildFilterParams()}
              filePrefix="members"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="border-border text-foreground hover:bg-card hover:text-foreground"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              รีเฟรช
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateAdminOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              เพิ่มแอดมิน
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <UsersStats
          stats={stats}
          loading={false}
          activeMemberType={memberType}
          activeRole={role}
          onMemberTypeChange={(val) => {
            setMemberType(val)
            setPage(1)
          }}
          onRoleChange={(val) => {
            setRole(val)
            setPage(1)
          }}
        />

        {/* Search & Filter */}
        <UsersSearch
          currentRole={role}
          currentMemberType={memberType}
          onSearch={(value: string) => {
            setSearch(value)
            setPage(1)
          }}
          onRoleChange={(value: string) => {
            setRole(value)
            setPage(1)
          }}
          onMemberTypeChange={(value: string) => {
            setMemberType(value)
            setPage(1)
          }}
        />

        {/* Table with Loading State */}
        <Card className="bg-background border-border">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <UsersTable
                data={users}
                isLoading={false}
                page={page}
                totalPages={totalPages}
                onPageChange={(p: number) => setPage(p)}
                onRefresh={fetchUsers}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            )}
          </CardContent>
        </Card>

        {/* Create Admin Modal */}
        <CreateAdminModal
          isOpen={isCreateAdminOpen}
          onClose={() => setIsCreateAdminOpen(false)}
          onSuccess={() => {
            setIsCreateAdminOpen(false)
            fetchUsers()
          }}
        />

        {/* Edit Modal (regular users) */}
        <EditUserModal
          isOpen={isEditModalOpen}
          user={selectedUser}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveUser}
          isLoading={isSaving}
        />

        {/* Edit Admin Modal */}
        <EditAdminModal
          isOpen={isEditAdminModalOpen}
          user={selectedUser}
          onClose={() => setIsEditAdminModalOpen(false)}
          onSuccess={() => {
            setIsEditAdminModalOpen(false)
            fetchUsers()
          }}
        />

        {/* Delete Dialog */}
        <DeleteUserDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onSuccess={handleDeleteSuccess}
          user={selectedUser}
        />
      </div>
    </div>
  )
}
