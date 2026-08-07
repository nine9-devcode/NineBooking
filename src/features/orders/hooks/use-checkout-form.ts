// hooks/checkout/use-checkout-form.ts
import { useState, useEffect } from "react"
import { Session } from "next-auth"
import { CheckoutFormData } from "@/features/orders/checkout.types"

export function useCheckoutForm(session: Session | null) {
  const [formData, setFormData] = useState<CheckoutFormData>({
    customerName: "",
    customerNickname: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    shippingProvince: "",
    shippingDistrict: "",
    shippingSubDistrict: "",
    shippingPostalCode: "",
    shippingResidenceType: "",
    customerNote: "",
  })

  // เติมข้อมูลจาก session
  useEffect(() => {
    if (session?.user) {
      const user = session.user

      setFormData((prev) => ({
        ...prev,
        customerName: user.name || prev.customerName || "",
        customerEmail: user.email || prev.customerEmail || "",
        customerNickname: user.nickname || prev.customerNickname || "",
        customerPhone: user.phone || prev.customerPhone || "",
        shippingAddress: user.address || prev.shippingAddress || "",
        shippingProvince: user.province || prev.shippingProvince || "",
        shippingDistrict: user.district || prev.shippingDistrict || "",
        shippingSubDistrict: user.subDistrict || prev.shippingSubDistrict || "",
        shippingPostalCode: user.postalCode || prev.shippingPostalCode || "",
        shippingResidenceType: user.residenceType || prev.shippingResidenceType || "",
      }))
    }
  }, [session])

  // จัดการ input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // อัพเดทฟิลด์
  const updateField = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // จัดการ Select change
  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return {
    formData,
    setFormData,
    handleChange,
    updateField,
    handleSelectChange,
  }
}
