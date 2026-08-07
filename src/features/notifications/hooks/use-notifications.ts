"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export type NotificationType = "order" | "issue"

export interface BaseNotification {
  id: string
  type: NotificationType
  isRead: boolean
  createdAt: string
}

export interface OrderNotification extends BaseNotification {
  type: "order"
  orderId: string
  orderNumber: string
  customerName: string
  customerNickname?: string | null
  totalItems: number
}

export interface IssueNotification extends BaseNotification {
  type: "issue"
  issueId: string
  issueNumber: string
  userName: string
  userNickname?: string | null
  subject: string
}

export type UnifiedNotification = OrderNotification | IssueNotification

export function useNotifications() {
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [ordersUnreadCount, setOrdersUnreadCount] = useState(0)
  const [issuesUnreadCount, setIssuesUnreadCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const orderEventSourceRef = useRef<EventSource | null>(null)
  const issueEventSourceRef = useRef<EventSource | null>(null)
  const bellTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // #6 — Helper: trigger bell animation พร้อม cleanup
  const triggerBellAnimation = useCallback(() => {
    if (bellTimeoutRef.current) {
      clearTimeout(bellTimeoutRef.current)
    }
    setHasNewNotification(true)
    bellTimeoutRef.current = setTimeout(() => setHasNewNotification(false), 1000)
  }, [])

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const [ordersRes, issuesRes] = await Promise.all([
        fetch("/api/admin/notifications?limit=20"),
        fetch("/api/admin/issue-notifications?limit=20"),
      ])

      if (!ordersRes.ok || !issuesRes.ok) {
        console.error("Failed to fetch notifications: API returned error")
        setIsLoading(false)
        return
      }

      const ordersData = await ordersRes.json()
      const issuesData = await issuesRes.json()

      // แปลงเป็น unified format
      const orderNotifs: OrderNotification[] = (ordersData.notifications || []).map(
        (n: any) => ({
          ...n,
          type: "order" as const,
        })
      )

      const issueNotifs: IssueNotification[] = (issuesData.notifications || []).map(
        (n: any) => ({
          ...n,
          type: "issue" as const,
          issueId: n.issueId || n.id,
        })
      )

      // รวมและเรียงตามวันที่ล่าสุด
      const combined = [...orderNotifs, ...issueNotifs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      const ordersUnread = ordersData.unreadCount || 0
      const issuesUnread = issuesData.unreadCount || 0
      setNotifications(combined)
      setOrdersUnreadCount(ordersUnread)
      setIssuesUnreadCount(issuesUnread)
      setUnreadCount(ordersUnread + issuesUnread)
      // #7 — ใช้ totalCount จาก API แทน combined.length
      setTotalCount((ordersData.totalCount || combined.length) + (issuesData.totalCount || 0))
      setIsLoading(false)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // #1 — SSE connection for Order notifications (พร้อม reconnect จริง)
  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

    const connectOrderSSE = () => {
      if (orderEventSourceRef.current) {
        orderEventSourceRef.current.close()
      }

      const eventSource = new EventSource("/api/admin/notifications/stream")
      orderEventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data)

          const orderNotif: OrderNotification = {
            ...notification,
            type: "order",
          }

          setNotifications((prev) => [orderNotif, ...prev])
          setUnreadCount((prev) => prev + 1)
          setTotalCount((prev) => prev + 1)

          triggerBellAnimation()

          const displayName = notification.customerNickname
            ? `${notification.customerNickname} (${notification.customerName})`
            : notification.customerName

          toast.info("คำสั่งจองใหม่!", {
            description: `${notification.orderNumber} • ${displayName} • ${notification.totalItems} รายการ`,
            action: {
              label: "ดูรายละเอียด",
              onClick: () => router.push(`/admin/orders/${notification.orderId}`),
            },
            duration: 5000,
          })
        } catch {
          // Ignore heartbeat messages
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        orderEventSourceRef.current = null

        // Reconnect after 5 seconds
        reconnectTimeout = setTimeout(() => {
          connectOrderSSE()
        }, 5000)
      }
    }

    connectOrderSSE()

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (orderEventSourceRef.current) {
        orderEventSourceRef.current.close()
        orderEventSourceRef.current = null
      }
    }
  }, [router, triggerBellAnimation])

  // #1 — SSE connection for Issue notifications (พร้อม reconnect จริง)
  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

    const connectIssueSSE = () => {
      if (issueEventSourceRef.current) {
        issueEventSourceRef.current.close()
      }

      const eventSource = new EventSource("/api/admin/issue-notifications/stream")
      issueEventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data)

          const issueNotif: IssueNotification = {
            ...notification,
            type: "issue",
            issueId: notification.issueId || notification.id,
          }

          setNotifications((prev) => [issueNotif, ...prev])
          setUnreadCount((prev) => prev + 1)
          setTotalCount((prev) => prev + 1)

          triggerBellAnimation()

          const displayName = notification.userNickname
            ? `${notification.userNickname} (${notification.userName})`
            : notification.userName

          toast.info("ปัญหาใหม่!", {
            description: `${notification.issueNumber} • ${displayName} • ${notification.subject}`,
            action: {
              label: "ดูรายละเอียด",
              onClick: () => router.push(`/admin/contact-issues/${notification.issueId}`),
            },
            duration: 5000,
          })
        } catch {
          // Ignore heartbeat messages
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        issueEventSourceRef.current = null

        // Reconnect after 5 seconds
        reconnectTimeout = setTimeout(() => {
          connectIssueSSE()
        }, 5000)
      }
    }

    connectIssueSSE()

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (issueEventSourceRef.current) {
        issueEventSourceRef.current.close()
        issueEventSourceRef.current = null
      }
    }
  }, [router, triggerBellAnimation])

  // #6 — Cleanup bell timeout on unmount
  useEffect(() => {
    return () => {
      if (bellTimeoutRef.current) {
        clearTimeout(bellTimeoutRef.current)
      }
    }
  }, [])

  // Mark single notification as read
  const markAsRead = async (
    notificationId: string,
    targetId: string,
    type: NotificationType
  ) => {
    try {
      const endpoint =
        type === "order"
          ? `/api/admin/notifications/${notificationId}`
          : `/api/admin/issue-notifications/${notificationId}`

      await fetch(endpoint, {
        method: "PATCH",
      })

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      if (type === "order") {
        setOrdersUnreadCount((prev) => Math.max(0, prev - 1))
      } else {
        setIssuesUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  // Refresh just the unread counts (called after detail-page mark-read)
  const refreshCounts = async () => {
    try {
      const [ordersRes, issuesRes] = await Promise.all([
        fetch("/api/admin/notifications?limit=1"),
        fetch("/api/admin/issue-notifications?limit=1"),
      ])
      if (!ordersRes.ok || !issuesRes.ok) return
      const [od, id] = await Promise.all([ordersRes.json(), issuesRes.json()])
      const ordersUnread = od.unreadCount || 0
      const issuesUnread = id.unreadCount || 0
      setOrdersUnreadCount(ordersUnread)
      setIssuesUnreadCount(issuesUnread)
      setUnreadCount(ordersUnread + issuesUnread)
    } catch {}
  }

  // #2 — Mark all notifications as read (ส่ง body สำหรับ issue-notifications)
  const markAllAsRead = async () => {
    try {
      await Promise.all([
        fetch("/api/admin/notifications", {
          method: "PATCH",
        }),
        fetch("/api/admin/issue-notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }),
      ])

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      setOrdersUnreadCount(0)
      setIssuesUnreadCount(0)

      toast.success("อ่านการแจ้งเตือนทั้งหมดแล้ว")
    } catch (error) {
      console.error("Failed to mark all as read:", error)
      toast.error("เกิดข้อผิดพลาด")
    }
  }

  // Clear all notifications
  const clearAll = async () => {
    try {
      await Promise.all([
        fetch("/api/admin/notifications", {
          method: "DELETE",
        }),
        fetch("/api/admin/issue-notifications", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }),
      ])

      setNotifications([])
      setUnreadCount(0)
      setOrdersUnreadCount(0)
      setIssuesUnreadCount(0)
      setTotalCount(0)

      toast.success("ล้างการแจ้งเตือนทั้งหมดแล้ว")
    } catch (error) {
      console.error("Failed to clear notifications:", error)
      toast.error("เกิดข้อผิดพลาด")
    }
  }

  return {
    notifications,
    unreadCount,
    ordersUnreadCount,
    issuesUnreadCount,
    totalCount,
    isLoading,
    hasNewNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    refetch: fetchNotifications,
    refreshCounts,
  }
}
