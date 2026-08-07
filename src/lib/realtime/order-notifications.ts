import { SseChannel } from "./channel"

/** รูปร่างของกระดิ่ง "มีคำสั่งจองใหม่" ที่ยิงไปหาแอดมิน */
export interface OrderNotificationPayload {
  id: string
  orderId: string
  orderNumber: string
  customerName: string
  customerNickname: string | null
  totalItems: number
  isRead: boolean
  createdAt: string
}

const channel = new SseChannel<OrderNotificationPayload>("order-notifications")

export function notifyAdmins(notification: OrderNotificationPayload): void {
  channel.broadcast(notification)
}

export function subscribeOrderNotifications(signal: AbortSignal): Response {
  return channel.subscribe(signal)
}
