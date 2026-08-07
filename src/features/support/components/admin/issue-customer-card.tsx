// components/admin/contact-issues/issue-customer-card.tsx
"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Phone } from "lucide-react"

interface IssueCustomerCardProps {
  user: {
    name?: string | null
    nickname?: string | null
    email?: string | null
    phone?: string | null
    image?: string | null
  } | null
}

export function IssueCustomerCard({ user }: IssueCustomerCardProps) {
  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-foreground flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          ข้อมูลผู้แจ้ง
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        {/* User Deleted Notice */}
        {!user && (
          <div className="text-xs text-muted-foreground bg-background/50 rounded-lg px-3 py-2 border border-border mb-2">
            บัญชีสมาชิกถูกลบออกจากระบบแล้ว
          </div>
        )}

        {/* User Profile */}
        {user && (
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
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
            </div>
          </div>
        )}

        {/* Email */}
        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border">
          <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">อีเมล</p>
            {user?.email ? (
              <a
                href={`mailto:${user.email}`}
                className="text-primary hover:underline truncate block"
              >
                {user.email}
              </a>
            ) : (
              <p className="text-muted-foreground">ไม่ระบุ</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border">
          <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">เบอร์โทร</p>
            {user?.phone ? (
              <a href={`tel:${user.phone}`} className="text-primary hover:underline">
                {user.phone}
              </a>
            ) : (
              <p className="text-muted-foreground">ไม่ระบุ</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
