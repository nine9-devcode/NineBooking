import { requireAdmin } from "@/lib/api/guards"
import { subscribeOrderNotifications } from "@/lib/realtime/order-notifications"

// SSE สำหรับกระดิ่ง "คำสั่งจองใหม่" ในหลังบ้าน
// ตัวจัดการช่องทางอยู่ที่ lib/realtime — route นี้มีหน้าที่แค่ตรวจสิทธิ์แล้วต่อสาย
export async function GET(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  return subscribeOrderNotifications(request.signal)
}
