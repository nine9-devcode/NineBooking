// app/support/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Send, History } from "lucide-react"
import { toast } from "sonner"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useSupportNotifications } from "@/features/notifications/hooks/use-support-notifications"
import {
  SupportHeader,
  SubjectInput,
  DescriptionTextarea,
  MultiImageUpload,
  CategorySelect,
  StatusMessage,
  SubmitButton,
  SupportFooter,
  SupportFormCard,
  IssueHistoryList,
} from "@/features/support/components"

export default function ContactPage() {
  const { status } = useSession()
  const router = useRouter()
  const { refresh: refreshSupportNotifications } = useSupportNotifications()

  // Tab State
  const [activeTab, setActiveTab] = useState("report")

  // Form State
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
  })
  const [category, setCategory] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"success" | "loading" | null>(null)
  const [errors, setErrors] = useState<any>({})
  const [countdown, setCountdown] = useState(0)

  // History State
  const [issues, setIssues] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Authentication Check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Mark support notifications as read เมื่อเข้าหน้านี้
  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/user/support-notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    }).then(() => refreshSupportNotifications())
  }, [status, refreshSupportNotifications])

  // Countdown Timer
  useEffect(() => {
    if (submitStatus === "success" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [submitStatus, countdown])

  // Fetch issues when history tab is active
  const fetchIssues = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch("/api/support")
      const data = await res.json()
      setIssues(data.issues || [])
    } catch {
      toast.error("ไม่สามารถโหลดประวัติได้")
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "history") {
      fetchIssues()
    }
  }, [activeTab, fetchIssues])

  // Handlers
  const handleSubjectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, subject: value }))
    if (errors.subject) {
      setErrors((prev: any) => ({ ...prev, subject: "" }))
    }
  }

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }))
    if (errors.description) {
      setErrors((prev: any) => ({ ...prev, description: "" }))
    }
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    if (errors.category) {
      setErrors((prev: any) => ({ ...prev, category: "" }))
    }
  }

  const handleImagesChange = (files: File[]) => {
    setImages(files)
    setErrors((prev: any) => ({ ...prev, image: "" }))

    // Generate previews
    const previews: string[] = []
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        previews.push(reader.result as string)
        if (previews.length === files.length) {
          setImagePreviews([...previews])
        }
      }
      reader.readAsDataURL(file)
    })

    if (files.length === 0) {
      setImagePreviews([])
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImages(newImages)
    setImagePreviews(newPreviews)
  }

  const validateForm = () => {
    const newErrors: any = {}

    if (!category) {
      newErrors.category = "กรุณาเลือกประเภทปัญหา"
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "กรุณาระบุหัวข้อปัญหา"
    }

    if (!formData.description.trim()) {
      newErrors.description = "กรุณาอธิบายรายละเอียดปัญหา"
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "กรุณาอธิบายรายละเอียดอย่างน้อย 10 ตัวอักษร"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitStatus("loading")

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("subject", formData.subject.trim())
      formDataToSend.append("description", formData.description.trim())
      formDataToSend.append("category", category)

      images.forEach((img) => {
        formDataToSend.append("files", img)
      })

      const response = await fetch("/api/support", {
        method: "POST",
        body: formDataToSend,
      })

      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        throw new Error("ระบบตอบกลับไม่ถูกต้อง")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการส่งข้อมูล")
      }

      setSubmitStatus("success")
      setCountdown(3)

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({ subject: "", description: "" })
        setCategory("")
        setImages([])
        setImagePreviews([])
        setSubmitStatus(null)
        setCountdown(0)
      }, 3000)
    } catch (error) {
      console.error("Submit error:", error)
      setSubmitStatus(null)
      toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewHistory = () => {
    setActiveTab("history")
  }

  // Loading State
  if (status === "loading") {
    return (
      <>
        <Navbar currentPage="แจ้งปัญหา" />
        <div className="min-h-screen bg-muted flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar currentPage="แจ้งปัญหา" />
      <main className="min-h-screen bg-muted pt-16 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <SupportHeader />

          {/* Tabs */}
          <SupportFormCard>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 h-11 bg-muted">
                <TabsTrigger
                  value="report"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  แจ้งปัญหา
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm gap-1.5"
                >
                  <History className="w-4 h-4" />
                  ประวัติของฉัน
                </TabsTrigger>
              </TabsList>

              {/* Report Form Tab */}
              <TabsContent value="report" className="space-y-6 pt-4">
                {/* Category Select */}
                <CategorySelect
                  value={category}
                  onChange={handleCategoryChange}
                  error={errors.category}
                  disabled={isSubmitting}
                />

                {/* Subject Input */}
                <SubjectInput
                  value={formData.subject}
                  onChange={handleSubjectChange}
                  error={errors.subject}
                  disabled={isSubmitting}
                />

                {/* Description Textarea */}
                <DescriptionTextarea
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  error={errors.description}
                  disabled={isSubmitting}
                  maxLength={500}
                />

                {/* Multi-Image Upload */}
                <MultiImageUpload
                  images={images}
                  imagePreviews={imagePreviews}
                  onImagesChange={handleImagesChange}
                  onRemove={handleRemoveImage}
                  error={errors.image}
                  disabled={isSubmitting}
                />

                {/* Status Message */}
                <StatusMessage
                  status={submitStatus}
                  countdown={countdown}
                  onViewHistory={handleViewHistory}
                />

                {/* Submit Button */}
                <SubmitButton onClick={handleSubmit} isSubmitting={isSubmitting} />
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history">
                <IssueHistoryList issues={issues} loading={historyLoading} />
              </TabsContent>
            </Tabs>
          </SupportFormCard>

          {/* Support Footer */}
          <SupportFooter />
        </div>
      </main>
      <Footer />
    </>
  )
}
