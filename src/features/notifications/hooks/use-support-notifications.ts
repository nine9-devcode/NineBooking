// hooks/use-support-notifications.ts

"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

export function useSupportNotifications() {
  const { status } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchUnreadCount = useCallback(async () => {
    if (status !== "authenticated") {
      setUnreadCount(0)
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/user/support-notifications?type=count")
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error fetching support notification count:", error)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Polling every 30 seconds
  useEffect(() => {
    if (status !== "authenticated") return
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [status, fetchUnreadCount])

  const refresh = useCallback(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  return {
    unreadCount,
    loading,
    hasUnread: unreadCount > 0,
    refresh,
  }
}
