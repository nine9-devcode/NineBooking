// app/api/admin/issue-notifications/stream/route.ts
import { requireAdmin } from "@/lib/api/guards"

// ตัวแปรเก็บ clients ที่กำลังเชื่อมต่อ
const clients = new Set<ReadableStreamDefaultController>()

// ฟังก์ชัน broadcast ข้อมูลไปยัง clients ทั้งหมด
export function broadcastIssueNotification(notification: any) {
  const data = JSON.stringify(notification)
  
  clients.forEach(controller => {
    try {
      controller.enqueue(`data: ${data}\n\n`)
    } catch (error) {
      // ถ้า controller ถูกปิดแล้ว ให้ลบออกจาก Set
      clients.delete(controller)
    }
  })
}

export async function GET(req: Request) {
  // ตรวจสอบ auth
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

  // สร้าง ReadableStream สำหรับ SSE
  const stream = new ReadableStream({
    start(controller) {
      // เพิ่ม client เข้า Set
      clients.add(controller)
      
      // ส่ง heartbeat ทุก 30 วินาที เพื่อรักษา connection
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`: heartbeat\n\n`)
        } catch (error) {
          clearInterval(heartbeat)
          clients.delete(controller)
        }
      }, 30000)

      // Cleanup เมื่อ connection ปิด
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        clients.delete(controller)
        try {
          controller.close()
        } catch (error) {
          // Already closed
        }
      })
    },
    
    cancel(controller) {
      clients.delete(controller)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}