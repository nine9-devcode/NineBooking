import { NextRequest } from 'next/server'
import { requireAdmin } from "@/lib/api/guards"

// เก็บ SSE clients ทั้งหมด
const clients: Set<ReadableStreamDefaultController> = new Set()

export async function GET(req: NextRequest) {
  try {
    // ตรวจสอบ auth
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const stream = new ReadableStream({
      start(controller) {
        clients.add(controller)
        
        // ส่งข้อความเริ่มต้น
        controller.enqueue(': connected\n\n')
        
        // ส่ง heartbeat ทุก 30 วินาที
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(': heartbeat\n\n')
          } catch (error) {
            clearInterval(heartbeat)
            clients.delete(controller)
          }
        }, 30000)
        
        // Cleanup เมื่อ client disconnect
        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeat)
          clients.delete(controller)
          console.log('Client disconnected, remaining:', clients.size)
        })
        
        console.log('Client connected, total:', clients.size)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('SSE error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// ฟังก์ชันส่ง notification ไปยัง admin ทุกคน
export function notifyAdmins(notification: any) {
  const data = JSON.stringify(notification)
  const message = `data: ${data}\n\n`
  
  console.log('Sending notification to', clients.size, 'clients')
  
  clients.forEach(client => {
    try {
      client.enqueue(message)
    } catch (error) {
      console.error('Failed to send to client:', error)
      clients.delete(client)
    }
  })
}