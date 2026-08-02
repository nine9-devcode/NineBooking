"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { FormAlert } from "@/features/auth/components/form-alert"
import { AddressSection, PersonalInfoSection, useRegister } from "@/features/auth/components/register"
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

function RegisterContent() {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState("step1")
  const [step1Done, setStep1Done] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const {
    formData,
    formErrors,
    filteredDistricts,
    filteredSubDistricts,
    handleChange,
    handleResidenceTypeChange,
    handleProvinceChange,
    handleDistrictChange,
    handleSubDistrictChange,
    validateStep1,
    validateStep2,
    getFinalResidenceType,
  } = useRegister()

  const handleNextStep = () => {
    setError("")

    if (!validateStep1()) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน")
      setStep1Done(false)
      return
    }

    setStep1Done(true)
    setActiveTab("step2")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateStep1()) {
      setError("กรุณากรอกข้อมูลพื้นฐานให้ครบถ้วน")
      setActiveTab("step1")
      return
    }

    if (!validateStep2()) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          nickname: formData.nickname,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          residenceType: getFinalResidenceType(),
          address: formData.address || "",
          province: formData.province || "",
          district: formData.district || "",
          subDistrict: formData.subDistrict || "",
          postalCode: formData.postalCode || "",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? "เกิดข้อผิดพลาด")
      }

      router.push("/login?registered=true")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent)]"
      />

      <Card className="relative w-full max-w-3xl">
        <CardHeader className="flex flex-col items-center space-y-3">
          <Link href="/" aria-label="กลับหน้าแรก" className="text-foreground">
            <Logo className="text-foreground" />
          </Link>
          <CardDescription className="text-center text-sm">
            สร้างบัญชีใหม่เพื่อเริ่มจองสินค้า
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="step1" disabled={isLoading}>
                ข้อมูลพื้นฐาน
              </TabsTrigger>
              <TabsTrigger value="step2" disabled={isLoading || !step1Done}>
                ข้อมูลที่อยู่ (ไม่บังคับ)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="step1" className="mt-6 space-y-4">
              {error && activeTab === "step1" && (
                <FormAlert tone="error">{error}</FormAlert>
              )}

              <PersonalInfoSection
                formData={formData}
                formErrors={formErrors}
                isLoading={isLoading}
                handleChange={handleChange}
                handleResidenceTypeChange={handleResidenceTypeChange}
              />

              <Button
                type="button"
                className="w-full"
                onClick={handleNextStep}
                disabled={isLoading}
              >
                ถัดไป
              </Button>
            </TabsContent>

            <TabsContent value="step2" className="mt-6 space-y-4">
              {error && activeTab === "step2" && (
                <FormAlert tone="error">{error}</FormAlert>
              )}

              <AddressSection
                formData={formData}
                formErrors={formErrors}
                isLoading={isLoading}
                filteredDistricts={filteredDistricts}
                filteredSubDistricts={filteredSubDistricts}
                handleChange={handleChange}
                handleProvinceChange={handleProvinceChange}
                handleDistrictChange={handleDistrictChange}
                handleSubDistrictChange={handleSubDistrictChange}
              />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("step1")}
                  disabled={isLoading}
                >
                  ย้อนกลับ
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังสมัครสมาชิก...
                    </>
                  ) : (
                    "สมัครสมาชิก"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-4">
          <p className="text-center text-xs text-muted-foreground">
            การสมัครสมาชิกถือว่าคุณยอมรับ{" "}
            <Link href="/terms" className="text-primary hover:underline">
              ข้อกำหนดการใช้งาน
            </Link>{" "}
            และ{" "}
            <Link href="/privacy-policy" className="text-primary hover:underline">
              นโยบายความเป็นส่วนตัว
            </Link>{" "}
            ของเรา
          </p>

          <p className="text-sm text-muted-foreground">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  )
}
