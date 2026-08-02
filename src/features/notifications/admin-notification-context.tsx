'use client'

import { createContext, useContext } from 'react'
import { useNotifications, UnifiedNotification, NotificationType } from '@/features/notifications/hooks/use-notifications'

interface AdminNotificationContextValue {
  notifications: UnifiedNotification[]
  unreadCount: number
  ordersUnreadCount: number
  issuesUnreadCount: number
  totalCount: number
  isLoading: boolean
  hasNewNotification: boolean
  markAsRead: (notificationId: string, targetId: string, type: NotificationType) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearAll: () => Promise<void>
  refetch: () => Promise<void>
  refreshCounts: () => Promise<void>
}

const AdminNotificationContext = createContext<AdminNotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  ordersUnreadCount: 0,
  issuesUnreadCount: 0,
  totalCount: 0,
  isLoading: true,
  hasNewNotification: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  clearAll: async () => {},
  refetch: async () => {},
  refreshCounts: async () => {},
})

export function AdminNotificationProvider({ children }: { children: React.ReactNode }) {
  const value = useNotifications()

  return (
    <AdminNotificationContext.Provider value={value}>
      {children}
    </AdminNotificationContext.Provider>
  )
}

export function useAdminNotifications() {
  return useContext(AdminNotificationContext)
}
