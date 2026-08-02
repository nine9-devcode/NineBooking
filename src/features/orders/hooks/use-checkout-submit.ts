// hooks/checkout/use-checkout-submit.ts
// จัดการส่งข้อมูล, validation, error handling

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckoutFormData, OrderSubmitResponse } from "@/features/orders/checkout.types"

interface UseCheckoutSubmitProps {
  onRefreshCart: () => Promise<void>
}

export function useCheckoutSubmit({ onRefreshCart }: UseCheckoutSubmitProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // ตรวจสอบข้อมูลฟอร์ม
  const validateForm = (formData: CheckoutFormData, cartItemIds: string[]) => {
    setError("")
    const errors: Record<string, string> = {}

    if (!formData.customerName.trim()) {
      errors.customerName = "กรุณากรอกชื่อผู้จอง"
    }

    if (!formData.customerEmail.trim()) {
      errors.customerEmail = "กรุณากรอกอีเมล"
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.customerEmail)) {
        errors.customerEmail = "รูปแบบอีเมลไม่ถูกต้อง"
      }
    }

    if (!formData.customerPhone.trim()) {
      errors.customerPhone = "กรุณากรอกเบอร์โทรศัพท์"
    }

    if (cartItemIds.length === 0) {
      setError("ไม่มีสินค้าในรายการ")
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0 && cartItemIds.length > 0
  }

  // ส่งคำสั่งจอง
  const handleSubmit = async (
    formData: CheckoutFormData,
    cartItemIds: string[]
  ) => {
    // Validate
    if (!validateForm(formData, cartItemIds)) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cartItemIds,
        }),
      })

      const data: OrderSubmitResponse = await res.json()

      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด")
        setIsLoading(false)
        return
      }

      // สำเร็จ - refresh cart
      await onRefreshCart()

      // redirect ไปหน้าสำเร็จ
      router.push(`/orders/${data.order.id}/success`)
    } catch (err) {
      console.error("Submit error:", err)
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
      setIsLoading(false)
    }
  }

  return {
    handleSubmit,
    isLoading,
    error,
    setError,
    fieldErrors,
    setFieldErrors,
  }
}