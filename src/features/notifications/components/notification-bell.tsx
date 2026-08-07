'use client'

import { Bell, Loader2, BellOff, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationItem } from './notification-item'
import { useAdminNotifications } from '@/features/notifications/admin-notification-context'
import Link from 'next/link'

const MAX_DISPLAY = 5

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAll,
    hasNewNotification,
  } = useAdminNotifications()

  // แสดงแค่ 5 รายการล่าสุด
  const displayedNotifications = notifications.slice(0, MAX_DISPLAY)
  const remainingCount = totalCount - MAX_DISPLAY

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-foreground hover:text-foreground hover:bg-accent"
        >
          <Bell 
            className={`h-5 w-5 transition-transform ${
              hasNewNotification ? 'animate-bell-shake' : ''
            }`} 
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-[min(380px,calc(100vw-2rem))] p-0 bg-background border-border shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card/80">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">
              การแจ้งเตือน
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                {unreadCount} ใหม่
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-info hover:text-info transition-colors px-2 py-1 rounded hover:bg-secondary"
              >
                อ่านทั้งหมด
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-secondary"
              >
                ล้าง
              </button>
            )}
          </div>
        </div>
        
        {/* Notifications List */}
        <div className="max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <span className="text-sm">กำลังโหลด...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BellOff className="h-12 w-12 mb-3 opacity-50" />
              <span className="text-sm font-medium">ไม่มีการแจ้งเตือน</span>
              <span className="text-xs mt-1">คำสั่งจองและปัญหาใหม่จะแสดงที่นี่</span>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {displayedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => markAsRead(
                    notification.id, 
                    notification.type === 'order' ? notification.orderId : notification.issueId,
                    notification.type
                  )}
                />
              ))}
              
              {/* แสดงจำนวนที่เหลือ */}
              {remainingCount > 0 && (
                <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground border-t border-border mt-2">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="text-xs">
                    ยังมีอีก {remainingCount} รายการ
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border p-2 flex items-center gap-2">
           {/* ปุ่มที่ 1: สีปกติ */}
            <Link
              href="/admin/orders"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
            >
              ดูคำสั่งจองทั้งหมด
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/contact-issues"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors font-medium"
          >
              ดูปัญหาทั้งหมด
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
      )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}