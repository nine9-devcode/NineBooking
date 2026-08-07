// ไฟล์: app/admin/(dashboard)/settings/page.tsx
// หน้าตั้งค่าระบบ - แยก Components ให้ดูคลีน

import { Settings as SettingsIcon } from "lucide-react"
import {
  MaintenanceSettingsCard,
  SeoSettingsCard,
  QuotationSettingsCard,
} from "@/features/settings/components"

export default function SettingsPage() {
  return (
    <div className="flex-col">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            ตั้งค่าระบบ
          </h1>
          <p className="text-sm text-muted-foreground">จัดการการตั้งค่าและการแสดงผลของระบบ</p>
        </div>

        {/* Settings Cards */}
        <div className="grid gap-6">
          {/* Maintenance Settings */}
          <MaintenanceSettingsCard />

          {/* SEO Settings */}
          <SeoSettingsCard />

          {/* Quotation PDF Settings */}
          <QuotationSettingsCard />
        </div>
      </div>
    </div>
  )
}
