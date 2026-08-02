"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Construction, Lock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

export default function MaintenancePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // ถ้าเป็น admin ให้กลับไปหน้าแรกได้
        if (status === "authenticated" && session?.user?.role === "admin") {
          router.replace("/admin")
          return
        }

        // เช็คว่าระบบเปิดแล้วหรือยัง
        const res = await fetch("/api/settings/home-page")
        const data = await res.json()

        if (data.showHomePage) {
          // ถ้าเปิดแล้ว redirect กลับ
          router.replace("/")
        } else {
          setIsChecking(false)
        }
      } catch (error) {
        console.error("Error checking status:", error)
        setIsChecking(false)
      }
    }

    if (status !== "loading") {
      checkAccess()
    }
  }, [router, session, status])

  if (status === "loading" || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary to-secondary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <div className="relative bg-gradient-to-br from-primary to-primary p-6 rounded-full">
                <Construction className="w-12 h-12 text-foreground" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-foreground mb-3">
            ระบบปิดปรับปรุงชั่วคราว
          </h1>

          {/* Description */}
          <p className="text-center text-muted-foreground mb-8">
            เว็บไซต์อยู่ระหว่างการปรับปรุง
            <br />
            ขออภัยในความไม่สะดวก
          </p>

          {/* Info Box */}
          <div className="bg-background/50 border border-border rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-foreground font-medium mb-1">
                  ไม่สามารถเข้าถึงได้ในขณะนี้
                </p>
                <p className="text-xs text-muted-foreground">
                  เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงได้
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground mb-2">
              ติดต่อสอบถาม:
            </p>
            <a
              href="tel:081-694-2896"
              className="text-primary hover:text-primary font-medium transition-colors"
            >
              081-694-2896
            </a>
          </div>

          {/* Logout for non-admin users */}
          {status === "authenticated" && session?.user?.role !== "admin" && (
            <Button
              variant="outline"
              className="w-full border-border hover:bg-secondary hover:border-border text-foreground"
              onClick={() => signOut({ callbackUrl: '/login' })} 
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              ออกจากระบบ
            </Button>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 NineBooking. All rights reserved.
        </p>
      </div>
    </div>
  )
}