import { SseChannel } from "./channel"

/** รูปร่างของกระดิ่ง "มีเรื่องแจ้งปัญหาใหม่" ที่ยิงไปหาแอดมิน */
export interface IssueNotificationPayload {
  id: string
  issueId: string
  issueNumber: string
  userName: string
  userNickname: string | null
  subject: string
  isRead: boolean
  createdAt: string
}

const channel = new SseChannel<IssueNotificationPayload>("issue-notifications")

export function broadcastIssueNotification(notification: IssueNotificationPayload): void {
  channel.broadcast(notification)
}

export function subscribeIssueNotifications(signal: AbortSignal): Response {
  return channel.subscribe(signal)
}
