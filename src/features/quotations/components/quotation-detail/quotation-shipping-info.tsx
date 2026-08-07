// components/admin/quotations/quotation-detail/quotation-shipping-info.tsx

"use client"

import { MapPin, Home } from "lucide-react"
import { QuotationDetail } from "../types"
import { formatAddress } from "./quotation-types"
import { getResidenceTypeLabel } from "@/lib/constants"

interface QuotationShippingInfoProps {
  shipping: QuotationDetail["shipping"]
}

export function QuotationShippingInfo({ shipping }: QuotationShippingInfoProps) {
  const formattedAddress = formatAddress(shipping)

  // ถ้าไม่มีทั้งที่อยู่และ residenceType ไม่ต้องแสดง
  if (!formattedAddress && !shipping.residenceType) return null

  return (
    <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-card/80">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          ที่อยู่จัดส่ง
        </h2>
      </div>
      <div className="p-6 space-y-4">
        {/* ประเภทที่อยู่อาศัย */}
        {shipping.residenceType && (
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <Home className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">ประเภทที่อยู่อาศัย</p>
              <p className="text-foreground font-medium">
                {getResidenceTypeLabel(shipping.residenceType)}
              </p>
            </div>
          </div>
        )}

        {/* ที่อยู่ */}
        {formattedAddress && <p className="text-foreground">{formattedAddress}</p>}

        {/* ถ้าไม่มีที่อยู่แต่มี residenceType */}
        {!formattedAddress && shipping.residenceType && (
          <p className="text-muted-foreground text-sm italic">ไม่ได้ระบุที่อยู่จัดส่ง</p>
        )}
      </div>
    </div>
  )
}
