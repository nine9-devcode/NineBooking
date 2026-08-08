"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Settings,
  History,
  Wrench,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  FileText,
  BarChart3,
  X,
} from "lucide-react"
import { useSession } from "next-auth/react"

import { useAdminNotifications } from "@/features/notifications/admin-notification-context"
import { isSuperAdminRole } from "@/lib/roles"

const SIDEBAR_KEY = "admin-sidebar-collapsed"

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "จัดการสินค้า",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "จัดการหมวดหมู่",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    title: "คำสั่งจอง",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "ใบเสนอราคา",
    href: "/admin/quotations",
    icon: FileText,
  },
  {
    title: "สมาชิก",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "แจ้งปัญหา",
    icon: MessageSquare,
    href: "/admin/contact-issues",
  },
  {
    title: "สรุปรายงาน",
    href: "/admin/report",
    icon: BarChart3,
  },
  {
    title: "ประวัติการใช้งาน",
    href: "/admin/audit-log",
    icon: History,
  },
  {
    title: "เครื่องมือระบบ",
    href: "/admin/dev-tools",
    icon: Wrench,
    // เมนูนี้ลบข้อมูลได้ จึงโผล่เฉพาะผู้ดูแลระบบสูงสุด
    // การกั้นจริงอยู่ที่ requireSuperAdmin() ใน API — ตรงนี้แค่ไม่ให้เกะกะสายตา
    superAdminOnly: true,
  },
  {
    title: "ตั้งค่า",
    href: "/admin/settings",
    icon: Settings,
  },
]

interface AdminSidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function AdminSidebar({
  collapsed,
  onCollapse,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { ordersUnreadCount, issuesUnreadCount } = useAdminNotifications()

  const visibleItems = menuItems.filter(
    (item) => !("superAdminOnly" in item) || isSuperAdminRole(session?.user?.role)
  )

  const getBadgeCount = (href: string) => {
    if (href === "/admin/orders") return ordersUnreadCount
    if (href === "/admin/contact-issues") return issuesUnreadCount
    return 0
  }

  const toggleCollapsed = () => {
    const next = !collapsed
    onCollapse(next)
    try {
      localStorage.setItem(SIDEBAR_KEY, JSON.stringify(next))
    } catch {}
  }

  return (
    <aside
      className={cn(
        "fixed left-0 flex flex-col bg-background border-r border-border z-40",
        // Mobile: full-height drawer, slide in/out
        "top-0 h-full w-64 transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: override — always visible, top-16, collapse width
        "md:top-16 md:bottom-0 md:h-auto md:translate-x-0 md:transition-all md:duration-300",
        collapsed ? "md:w-16" : "md:w-64"
      )}
    >
      {/* Mobile: Close Button (top-right) */}
      <button
        onClick={onMobileClose}
        className="md:hidden absolute right-3 top-3 p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-colors"
        aria-label="ปิดเมนู"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Mobile: Logo area */}
      <div className="md:hidden flex items-center gap-3 px-4 pt-4 pb-2 border-b border-border">
        <span className="text-base font-bold text-foreground font-heading">
          NineBooking Admin
        </span>
      </div>

      {/* Desktop: Toggle Collapse Button */}
      <button
        onClick={toggleCollapsed}
        className="hidden md:flex absolute -right-3 top-6 bg-card hover:bg-secondary text-muted-foreground rounded-full p-1 border border-border transition-colors"
        aria-label={collapsed ? "ขยาย Sidebar" : "ย่อ Sidebar"}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 mt-4">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(item.href + "/")

          const badgeCount = getBadgeCount(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                "hover:bg-card",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
                collapsed && "md:justify-center"
              )}
              title={collapsed ? item.title : undefined}
            >
              {/* Icon with red dot when collapsed */}
              <div className="relative flex-shrink-0">
                <Icon className="w-5 h-5" />
                {badgeCount > 0 && collapsed && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive" />
                )}
              </div>
              <span className={cn("font-medium flex-1", collapsed && "md:hidden")}>
                {item.title}
              </span>
              {/* Badge when expanded */}
              {badgeCount > 0 && !collapsed && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer Info — hidden when collapsed on desktop
          เป็น sibling ปกติของ nav ไม่ใช่ absolute ไม่งั้นทับเมนูตัวท้ายบนจอเตี้ย */}
      <div className={cn("shrink-0 p-4 pt-0", collapsed && "md:hidden")}>
        <div className="bg-card/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground">NineBooking Admin v1.0</p>
          <p className="text-xs text-muted-foreground mt-1">© 2025 All Rights Reserved</p>
        </div>
      </div>
    </aside>
  )
}
