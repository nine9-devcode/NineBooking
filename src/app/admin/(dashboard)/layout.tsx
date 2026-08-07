"use client"

import { useState, useEffect } from "react"
import { AdminNavbar } from "@/components/layout/admin-navbar"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { AdminNotificationProvider } from "@/features/notifications/admin-notification-context"
import { cn } from "@/lib/utils"

const SIDEBAR_KEY = "admin-sidebar-collapsed"

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // อ่าน localStorage ตอน mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY)
      if (saved !== null) {
        setCollapsed(JSON.parse(saved))
      }
    } catch {}
  }, [])

  return (
    <AdminNotificationProvider>
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <AdminNavbar onMobileMenuToggle={() => setMobileOpen(prev => !prev)} />

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content — mobile: no left padding, desktop: ปรับตาม sidebar */}
      <main className={cn(
        "pt-16 transition-all duration-300",
        collapsed ? "md:pl-16" : "md:pl-64"
      )}>
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
    </AdminNotificationProvider>
  )
}
