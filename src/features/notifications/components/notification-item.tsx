"use client"

import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { th } from "date-fns/locale"
import { Clock, User, AlertCircle, ShoppingCart } from "lucide-react"
import { UnifiedNotification } from "@/features/notifications/hooks/use-notifications"

interface NotificationItemProps {
  notification: UnifiedNotification
  onRead: () => void
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const router = useRouter()

  const handleClick = () => {
    onRead()

    if (notification.type === "order") {
      router.push(`/admin/orders/${notification.orderId}`)
    } else {
      router.push(`/admin/contact-issues/${notification.issueId}`)
    }
  }

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: th,
  })

  const displayName = () => {
    if (notification.type === "order") {
      const { customerNickname, customerName } = notification
      if (customerNickname && customerName) {
        return `${customerNickname} (${customerName})`
      }
      return customerNickname || customerName || "ไม่ระบุชื่อ"
    } else {
      const { userNickname, userName } = notification
      if (userNickname && userName) {
        return `${userNickname} (${userName})`
      }
      return userNickname || userName || "ไม่ระบุชื่อ"
    }
  }

  const getIcon = () => {
    return notification.type === "order" ? (
      <ShoppingCart className="h-3.5 w-3.5" />
    ) : (
      <AlertCircle className="h-3.5 w-3.5" />
    )
  }

  const getBadgeColor = () => {
    if (!notification.isRead) {
      return notification.type === "order"
        ? "bg-primary/20 text-primary"
        : "bg-destructive/10 text-destructive"
    }
    return "bg-secondary text-muted-foreground"
  }

  const getBadgeText = () => {
    if (!notification.isRead) {
      return notification.type === "order" ? "คำสั่งจองใหม่!" : "ปัญหาใหม่!"
    }
    return notification.type === "order" ? "คำสั่งจอง" : "แจ้งปัญหา"
  }

  const ariaLabel =
    notification.type === "order"
      ? `ดูคำสั่งจอง ${notification.orderNumber}`
      : `ดูปัญหา ${notification.issueNumber}`

  return (
    <button
      onClick={handleClick}
      aria-label={ariaLabel}
      className={`
        w-full p-3 text-left rounded-lg transition-all duration-200
        border border-transparent
        ${
          !notification.isRead
            ? notification.type === "order"
              ? "bg-primary/10 hover:bg-primary/15 border-primary/20"
              : "bg-destructive/10 hover:bg-destructive/15 border-destructive/20"
            : "bg-card/50 hover:bg-card"
        }
      `}
    >
      {/* Row 1: Badge + Number + Time */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {!notification.isRead && (
            <span
              className={`flex h-2 w-2 rounded-full animate-pulse ${
                notification.type === "order" ? "bg-primary" : "bg-destructive"
              }`}
            />
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getBadgeColor()}`}>
            {getBadgeText()}
          </span>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeAgo}
        </span>
      </div>

      {/* Row 2: Order/Issue Number */}
      <div className="mb-2">
        <span className="text-sm font-semibold text-foreground">
          {notification.type === "order" ? notification.orderNumber : notification.issueNumber}
        </span>
      </div>

      {/* Row 3: Details */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          <span className="truncate max-w-[180px]">{displayName()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {getIcon()}
          <span className="truncate max-w-[120px]">
            {notification.type === "order"
              ? `${notification.totalItems} รายการ`
              : notification.subject}
          </span>
        </div>
      </div>
    </button>
  )
}
