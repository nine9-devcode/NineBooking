// components/checkout/customer-info-section.tsx

import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Phone, Lock, ExternalLink } from "lucide-react"
import { CheckoutFormData } from "@/features/orders/checkout.types"

interface CustomerInfoSectionProps {
  formData: CheckoutFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  isLoading: boolean
  fieldErrors?: Record<string, string>
}

export function CustomerInfoSection({
  formData,
  onChange,
  isLoading,
  fieldErrors = {},
}: CustomerInfoSectionProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">ข้อมูลผู้จอง</h2>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ชื่อ-นามสกุล */}
        <div>
          <Label htmlFor="customerName">
            ชื่อ-นามสกุล <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={onChange}
              placeholder="ชื่อ นามสกุล"
              className={`pl-10 ${fieldErrors.customerName ? "border-destructive/40 focus-visible:ring-destructive" : ""}`}
              disabled={isLoading}
              required
            />
          </div>
          {fieldErrors.customerName && (
            <p className="text-xs text-destructive mt-1">{fieldErrors.customerName}</p>
          )}
        </div>

        {/* ชื่อเล่น */}
        <div>
          <Label htmlFor="customerNickname">ชื่อเล่น</Label>
          <Input
            id="customerNickname"
            name="customerNickname"
            value={formData.customerNickname}
            onChange={onChange}
            placeholder="ชื่อเล่น"
            disabled={isLoading}
          />
        </div>

        {/* อีเมล */}
        <div>
          <Label htmlFor="customerEmail">
            อีเมล <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="customerEmail"
              name="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={onChange}
              placeholder="example@email.com"
              className={`pl-10 ${fieldErrors.customerEmail ? "border-destructive/40 focus-visible:ring-destructive" : ""}`}
              disabled={isLoading}
              required
            />
          </div>
          {fieldErrors.customerEmail && (
            <p className="text-xs text-destructive mt-1">{fieldErrors.customerEmail}</p>
          )}
        </div>

        {/* เบอร์โทร (ปิดการแก้ไข) */}
        <div>
          <Label htmlFor="customerPhone">
            เบอร์โทรศัพท์ <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="customerPhone"
              name="customerPhone"
              value={formData.customerPhone}
              placeholder="08X-XXX-XXXX"
              className="pl-10 pr-10 bg-muted"
              disabled={true} // ปิดการแก้ไข
              required
            />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          {/* ลิงก์ไปหน้า Profile */}
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span>เบอร์โทรที่ยืนยันแล้ว</span>
            <Link
              href="/profile"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              แก้ไขที่หน้าโปรไฟล์
              <ExternalLink className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
