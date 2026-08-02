// components/admin/quotations/quotation-detail/quotation-customer-info.tsx

"use client"

import Image from "next/image"
import { User, Mail, Phone, UserCircle, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { QuotationDetail } from "../types"
import { formatDate } from "../constants"
import { getMemberTypeLabel, MEMBER_TYPE_COLORS } from "@/lib/constants"

interface QuotationCustomerInfoProps {
  customer: QuotationDetail["customer"]
  user: QuotationDetail["user"]
}

// Helper: เลือกสี Badge
function getMemberTypeBadgeVariant(memberType: string | null | undefined): "default" | "secondary" | "destructive" | "outline" {
  const variant = MEMBER_TYPE_COLORS[memberType || 'other']
  if (variant === "default" || variant === "secondary" || variant === "destructive" || variant === "outline") {
    return variant
  }
  return "secondary"
}

export function QuotationCustomerInfo({ customer, user }: QuotationCustomerInfoProps) {
  return (
    <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-card/50">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          ข้อมูลลูกค้า
        </h2>
      </div>
      <div className="p-6">
        {/* User Profile */}
        {user && (
          <div className="mb-4 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              {user.image ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary flex-shrink-0">
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary border-2 border-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-foreground font-semibold text-base">
                    {user.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-foreground">
                  {user.name || "ไม่ระบุชื่อ"}
                  {user.nickname && (
                    <span className="text-muted-foreground font-normal ml-1">
                      ({user.nickname})
                    </span>
                  )}
                </p>
                {/* Badge ประเภทสมาชิก */}
                <Badge 
                  variant={getMemberTypeBadgeVariant(user.memberType)}
                  className="capitalize px-2 py-0.5 text-xs font-normal"
                >
                  {getMemberTypeLabel(user.memberType ?? null)}
                </Badge>

                {user.memberSince && (
                  <p className="text-xs text-muted-foreground mt-1">
                    สมาชิกตั้งแต่ {formatDate(user.memberSince, false)}
                  </p>
                )}
              </div>
            </div>

            {/* ส่วนแสดงหมายเหตุ (Note) */}
            {user.memberTypeNote && (
              <div className="mt-3 bg-info/10 border border-info/30 rounded-lg p-3">
                <div className="flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-info mb-1">
                      หมายเหตุสมาชิก:
                    </p>
                    <p className="text-sm text-foreground leading-relaxed break-words">
                      {user.memberTypeNote}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-3">
          {/* ชื่อ */}
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-muted-foreground" />
            <div>
              <span className="text-foreground">{customer.name}</span>
              {customer.nickname && (
                <span className="text-muted-foreground ml-1">({customer.nickname})</span>
              )}
            </div>
          </div>

          {/* อีเมล */}
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <a
              href={`mailto:${customer.email}`}
              className="text-primary hover:underline"
            >
              {customer.email}
            </a>
          </div>

          {/* เบอร์โทร */}
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <a
              href={`tel:${customer.phone}`}
              className="text-primary hover:underline"
            >
              {customer.phone}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}