import { requireAdmin } from "@/lib/api/guards"
import { subscribeIssueNotifications } from "@/lib/realtime/issue-notifications"

// SSE สำหรับกระดิ่ง "เรื่องแจ้งปัญหาใหม่" ในหลังบ้าน
export async function GET(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  return subscribeIssueNotifications(request.signal)
}
