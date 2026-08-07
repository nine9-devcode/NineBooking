"use client"

import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
// import Image from "next/image"
import { LogOut, Menu, MonitorCog } from "lucide-react"
import { NavbarAvatar } from "@/components/layout/navbar-avatar"
import { NotificationBell } from "@/features/notifications/components/notification-bell"
import { useState, useEffect } from "react"

interface AdminNavbarProps {
  onMobileMenuToggle?: () => void
}

export function AdminNavbar({ onMobileMenuToggle }: AdminNavbarProps) {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin/login" })
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left: Hamburger (mobile) + Logo */}
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-colors"
            aria-label="เปิด/ปิด เมนู"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="p-2 bg-card rounded-lg">
            <MonitorCog className="w-6 h-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground font-heading">
              NineBooking Admin
            </span>
            <span className="text-xs text-muted-foreground -mt-1">ระบบจัดการหลังบ้าน</span>
          </div>
        </div>

        {/* Right: User Info + Logout */}
        <div className="flex items-center gap-4">
          {/* แจ้งเตือน */}
          {mounted && <NotificationBell />}

          {/* User Info */}
          {session?.user && (
            <div className="flex items-center gap-3 px-3 py-2 bg-card rounded-lg">
              <NavbarAvatar name={session.user.name || "Admin"} image={session.user.image} />
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-foreground">{session.user.name}</p>
                <p className="text-xs text-muted-foreground">ผู้ดูแลระบบ</p>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-border text-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive/40"
            size="sm"
            title="ออกจากระบบ"
          >
            <LogOut className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">ออกจากระบบ</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
