// app/admin/(dashboard)/contact-issues/[id]/page.tsx
"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAdminNotifications } from "@/features/notifications/admin-notification-context"
import {
  IssueDetailHeader,
  IssueStatusCard,
  IssueInfoCard,
  IssueImageCard,
  IssueCustomerCard,
  IssueResponseCard,
} from "@/features/support/components/admin"
import { getErrorMessage } from "@/lib/utils"

type IssueStatus = "PENDING" | "IN_PROGRESS" | "CLOSED"

interface Issue {
  id: string
  issueNumber: string
  subject: string
  description: string
  category?: string
  imageUrls: string[]
  status: IssueStatus
  adminResponse: string | null
  respondedAt: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    nickname: string | null
    email: string | null
    phone: string | null
  } | null
}

export default function ContactIssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { refreshCounts } = useAdminNotifications()

  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<IssueStatus>("PENDING")
  const [adminResponse, setAdminResponse] = useState("")

  // Fetch issue details
  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const response = await fetch(`/api/admin/contact-issues/${resolvedParams.id}`)
        const data = await response.json()

        if (!response.ok) throw new Error(data.error || "ไม่พบข้อมูล")

        setIssue(data)
        setStatus(data.status)
        setAdminResponse(data.adminResponse || "")
        // Mark issue notifications as read
        fetch(`/api/admin/contact-issues/${resolvedParams.id}/mark-read`, {
          method: "PATCH",
        }).then(() => refreshCounts())

        // Auto change PENDING → IN_PROGRESS เมื่อเปิดดู
        if (data.status === "PENDING") {
          fetch(`/api/admin/contact-issues/${resolvedParams.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "IN_PROGRESS" }),
          })
            .then(async (res) => {
              if (res.ok) {
                const updated = await res.json()
                setIssue(updated)
                setStatus(updated.status)
              }
            })
            .catch(console.error)
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error))
        router.push("/admin/contact-issues")
      } finally {
        setLoading(false)
      }
    }

    fetchIssue()
  }, [resolvedParams.id, router])

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch(`/api/admin/contact-issues/${resolvedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminResponse: adminResponse.trim() || undefined }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "ไม่สามารถบันทึกได้")

      toast.success("บันทึกข้อมูลสำเร็จ")
      setIssue(data)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!issue) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <IssueDetailHeader
        issueId={issue.id}
        issueNumber={issue.issueNumber}
        createdAt={issue.createdAt}
        saving={saving}
        onSave={handleSave}
      />

      {/* Status Card */}
      <IssueStatusCard status={status} onStatusChange={setStatus} />

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <IssueInfoCard subject={issue.subject} description={issue.description} category={issue.category} />
          <IssueImageCard imageUrls={issue.imageUrls} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <IssueCustomerCard user={issue.user} />
          <IssueResponseCard
            adminResponse={issue.adminResponse}
            respondedAt={issue.respondedAt}
            currentValue={adminResponse}
            onResponseChange={setAdminResponse}
            onSendResponse={handleSave}
            isSaving={saving}
          />
        </div>
      </div>
    </div>
  )
}