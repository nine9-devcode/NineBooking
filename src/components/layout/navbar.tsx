// ไฟล์: components/navbar.tsx

"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  User,
  ShoppingCart,
  AlertCircle,
  FileText,
} from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { NavbarAvatar } from "@/components/layout/navbar-avatar"
import { CategorySidebar } from "@/features/categories/components/category-sidebar"
import { CartBadge } from "@/features/cart/components/cart-badge"
import { useOrderNotifications } from "@/features/notifications/hooks/use-order-notifications"
import { useSupportNotifications } from "@/features/notifications/hooks/use-support-notifications"

interface NavbarProps {
  currentPage?: string
  selectedCategoryId?: string | null
  onSelectCategory?: (categoryId: string | null, name?: string, slug?: string) => void
}

export function Navbar({
  currentPage,
  selectedCategoryId = null,
  onSelectCategory,
}: NavbarProps) {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const pathname = usePathname()

  // ปิด dropdown เมื่อเปลี่ยนหน้า (รวม browser back/forward)
  useEffect(() => {
    setProfileOpen(false)
  }, [pathname])

  // ปิด dropdown เมื่อกด Escape
  useEffect(() => {
    if (!profileOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [profileOpen])

  // ดึง notification count
  const { unreadCount: unreadOrderCount, hasUnread: hasUnreadOrder } = useOrderNotifications()
  const { unreadCount: unreadSupportCount, hasUnread: hasUnreadSupport } =
    useSupportNotifications()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  // ตรวจสอบว่าอยู่หน้าแรกหรือไม่
  const isHomePage = !currentPage

  // Handle category select - ส่ง slug ไปด้วย
  const handleCategorySelect = (categoryId: string | null, name?: string, slug?: string) => {
    if (onSelectCategory) {
      onSelectCategory(categoryId, name, slug)
    }
    setSidebarOpen(false)
  }

  return (
    <>
      {/* Top Bar */}
      <header className="bg-card border-b border-border fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Menu Button (Mobile) + Logo + Breadcrumb */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            {isHomePage && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? "ปิดเมนูหมวดหมู่" : "เปิดเมนูหมวดหมู่"}
                aria-expanded={sidebarOpen}
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
              >
                {sidebarOpen ? (
                  <X className="w-6 h-6 text-muted-foreground" />
                ) : (
                  <Menu className="w-6 h-6 text-muted-foreground" />
                )}
              </button>
            )}

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/brand/mark.svg"
                alt="NineBooking"
                width={36}
                height={36}
                className="object-contain"
              />
              <div className="hidden sm:flex flex-col">
                <span className="text-xl font-bold text-primary leading-tight font-heading">
                  NineBooking
                </span>
                <span className="text-xs text-muted-foreground font-medium -mt-1">
                  ระบบจองสินค้าออนไลน์
                </span>
              </div>
            </Link>

            {/* Breadcrumb */}
            {!isHomePage && (
              <div className="hidden md:flex items-center gap-2 text-sm ml-4">
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  หน้าแรก
                </Link>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground font-medium">{currentPage}</span>
              </div>
            )}
          </div>

          {/* Right: Cart + User Profile + Logout */}
          <div className="flex items-center gap-2">
            {session?.user ? (
              <>
                {/* Cart Badge */}
                <CartBadge />

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-lg transition-colors relative"
                    aria-haspopup="true"
                    aria-expanded={profileOpen}
                  >
                    {/* Avatar พร้อมจุดแดงที่มุมขวาบน */}
                    <div className="relative">
                      <NavbarAvatar
                        name={session.user.name || "User"}
                        image={session.user.image}
                      />
                      {(hasUnreadOrder || hasUnreadSupport) && (
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-border" />
                      )}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-foreground">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>

                  {/* Dropdown Menu */}
                  {profileOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-card rounded-lg shadow-lg border border-border py-2 z-50"
                      role="menu"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-3 mb-2">
                          <NavbarAvatar
                            name={session.user.name || "User"}
                            image={session.user.image}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {session.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {session.user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted"
                        onClick={() => setProfileOpen(false)}
                        role="menuitem"
                      >
                        <User className="w-4 h-4" />
                        โปรไฟล์ของฉัน
                      </Link>

                      {/* ตะกร้าสินค้า */}
                      <Link
                        href="/cart"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted"
                        onClick={() => setProfileOpen(false)}
                        role="menuitem"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        ตะกร้าสินค้า
                      </Link>

                      {/* ประวัติการจอง */}
                      <Link
                        href="/orders"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted"
                        onClick={() => setProfileOpen(false)}
                        role="menuitem"
                      >
                        <FileText className="w-4 h-4" />
                        <span>ประวัติการจองสินค้า</span>
                        {unreadOrderCount > 0 && (
                          <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center font-medium">
                            {unreadOrderCount > 9 ? "9+" : unreadOrderCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        href="/support"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted"
                        onClick={() => setProfileOpen(false)}
                        role="menuitem"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>แจ้งปัญหา</span>
                        {unreadSupportCount > 0 && (
                          <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center font-medium">
                            {unreadSupportCount > 9 ? "9+" : unreadSupportCount}
                          </span>
                        )}
                      </Link>
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  size="sm"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">ออกจากระบบ</span>
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    เข้าสู่ระบบ
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary hover:bg-primary/90" size="sm">
                    สมัครสมาชิก
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      {isHomePage && (
        <aside className="hidden lg:block fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-card border-r border-border overflow-y-auto z-40">
          <CategorySidebar
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleCategorySelect}
          />
        </aside>
      )}

      {/* Sidebar - Mobile (Overlay) */}
      {isHomePage && sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ top: "64px" }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/50"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar */}
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border overflow-y-auto">
            <CategorySidebar
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleCategorySelect}
            />
          </aside>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {profileOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
      )}
    </>
  )
}
