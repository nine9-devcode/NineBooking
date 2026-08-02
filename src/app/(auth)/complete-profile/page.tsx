"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Info, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { FormAlert } from "@/features/auth/components/form-alert"
import {
  AddressSection,
  PersonalInfoSection,
  useCompleteProfile,
} from "@/features/auth/components/complete-profile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Logo } from "@/components/brand/logo"

export default function CompleteProfilePage() {
  const router = useRouter()
  const { status } = useSession()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("personal")
  const [personalDone, setPersonalDone] = useState(false)

  const {
    formData,
    formErrors,
    setFormErrors,
    filteredDistricts,
    filteredSubDistricts,
    provinces,
    handleChange,
    handleResidenceTypeChange,
    handleProvinceChange,
    handleDistrictChange,
    handleSubDistrictChange,
    validateTab1,
  } = useCompleteProfile()

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const handleCancel = async () => {
    setIsLoading(true)
    await signOut({ redirect: false })
    window.location.href = "/login"
  }

  const handleNext = () => {
    setError("")

    if (!validateTab1()) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน")
      setPersonalDone(false)
      return
    }

    setPersonalDone(true)
    setActiveTab("address")
  }

  const hasAddressData = () =>
    Boolean(
      formData.address ||
        formData.province ||
        formData.district ||
        formData.subDistrict ||
        formData.postalCode
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateTab1()) {
      setActiveTab("personal")
      setError("กรุณากรอกข้อมูลให้ครบถ้วน")
      return
    }

    // "other" ต้องถูกแทนที่ด้วยข้อความที่ผู้ใช้พิมพ์เองก่อนบันทึก
    if (formData.residenceType === "other") {
      setActiveTab("personal")
      setFormErrors((prev) => ({
        ...prev,
        residenceType: "กรุณาระบุประเภทที่อยู่อาศัย",
      }))
      setError("กรุณาระบุประเภทที่อยู่อาศัย")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/user/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          nickname: formData.nickname,
          phone: formData.phone,
          residenceType: formData.residenceType,
          address: formData.address || "",
          province: formData.province || "",
          district: formData.district || "",
          subDistrict: formData.subDistrict || "",
          postalCode: formData.postalCode || "",
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด")

      toast.success("บันทึกข้อมูลสำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง")

      // ต้องออกแล้วเข้าใหม่เพื่อให้ JWT พกข้อมูลโปรไฟล์ชุดใหม่
      setTimeout(async () => {
        await signOut({ redirect: false })
        window.location.href = "/login?message=profile-completed"
      }, 1000)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
      toast.error(message)
      setError(message)
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent)]"
      />

      <Card className="relative w-full max-w-3xl">
        <CardHeader className="flex flex-col items-center space-y-3">
          <Logo className="text-foreground" />
          <CardDescription className="text-center text-sm">
            กรุณากรอกข้อมูลให้ครบก่อนเริ่มใช้งาน
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4">
              <FormAlert tone="error">{error}</FormAlert>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="personal">
                ข้อมูลส่วนตัว
                <Badge variant="destructive" className="ml-2 text-xs">
                  บังคับ
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="address" disabled={!personalDone}>
                ที่อยู่
                <Badge variant="secondary" className="ml-2 text-xs">
                  ไม่บังคับ
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <div className="flex items-start gap-2 rounded-md border border-info/40 bg-info/10 p-3 text-sm text-info">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">ข้อมูลบังคับ</p>
                  <p className="mt-1 text-xs">กรุณากรอกข้อมูลให้ครบทุกช่อง</p>
                </div>
              </div>

              <PersonalInfoSection
                formData={formData}
                formErrors={formErrors}
                isLoading={isLoading}
                handleChange={handleChange}
                handleResidenceTypeChange={handleResidenceTypeChange}
              />

              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  ยกเลิก
                </Button>
                <Button type="button" onClick={handleNext} disabled={isLoading}>
                  ถัดไป
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4">
              <div className="flex items-start gap-2 rounded-md border border-info/40 bg-info/10 p-3 text-sm text-info">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">ข้อมูลเพิ่มเติม (ไม่บังคับ)</p>
                  <p className="mt-1 text-xs">
                    ข้ามไปก่อนแล้วมาเพิ่มทีหลังในหน้าโปรไฟล์ได้
                  </p>
                </div>
              </div>

              <AddressSection
                formData={formData}
                formErrors={formErrors}
                isLoading={isLoading}
                provinces={provinces}
                filteredDistricts={filteredDistricts}
                filteredSubDistricts={filteredSubDistricts}
                handleChange={handleChange}
                handleProvinceChange={handleProvinceChange}
                handleDistrictChange={handleDistrictChange}
                handleSubDistrictChange={handleSubDistrictChange}
              />

              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("personal")}
                  disabled={isLoading}
                >
                  ย้อนกลับ
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : hasAddressData() ? (
                    "บันทึกข้อมูล"
                  ) : (
                    "ข้ามขั้นตอนนี้และบันทึก"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-center text-xs text-muted-foreground">
            การดำเนินการต่อถือว่าคุณยอมรับ{" "}
            <Link href="/terms" className="text-primary hover:underline">
              ข้อกำหนดการใช้งาน
            </Link>{" "}
            และ{" "}
            <Link href="/privacy-policy" className="text-primary hover:underline">
              นโยบายความเป็นส่วนตัว
            </Link>{" "}
            ของเรา
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
