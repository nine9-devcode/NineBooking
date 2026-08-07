/**
 * ช่องทาง Server-Sent Events สำหรับกระดิ่งแจ้งเตือนฝั่งแอดมิน
 *
 * ⚠️ ข้อจำกัดที่ต้องรู้: รายชื่อผู้ฟังเก็บไว้ในหน่วยความจำของ process
 * ถ้ารันหลาย worker หรืออยู่บน serverless แอดมินที่ต่ออยู่กับ instance A
 * จะไม่ได้รับข้อความที่ยิงจาก instance B — ของจริงต้องมี Redis pub/sub
 * หรือบริการอย่าง Pusher/Ably มาคั่น สำหรับโปรเจกตัวอย่างที่รัน instance เดียว
 * แบบนี้พอ และฝั่ง client ยังมี polling สำรองอยู่
 *
 * เดิมโค้ดนี้อยู่ใน route.ts แล้ว route อื่น import ข้ามมาเรียก ซึ่งเป็น
 * anti-pattern ของ App Router — route module ควร export แค่ HTTP handler
 * และการ import ข้ามทำให้ bundle แยกกัน จนบางครั้ง Set ที่เขียนกับที่อ่านคนละตัว
 */
export class SseChannel<T> {
  private clients = new Set<ReadableStreamDefaultController<string>>()

  constructor(private readonly name: string) {}

  get size(): number {
    return this.clients.size
  }

  /** ส่งข้อความหาผู้ฟังทุกคน — ตัวที่ปิดไปแล้วจะถูกถอดออกจากรายชื่อ */
  broadcast(payload: T): void {
    const message = `data: ${JSON.stringify(payload)}\n\n`

    for (const client of this.clients) {
      try {
        client.enqueue(message)
      } catch {
        this.clients.delete(client)
      }
    }
  }

  /** สร้าง Response ของ SSE ที่ดูแลการเก็บกวาดให้ครบทั้ง abort และ cancel */
  subscribe(signal: AbortSignal): Response {
    const clients = this.clients
    const name = this.name

    const stream = new ReadableStream<string>({
      start(controller) {
        clients.add(controller)
        controller.enqueue(`: connected to ${name}\n\n`)

        // heartbeat กัน proxy ตัดสายที่เงียบนาน
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(": heartbeat\n\n")
          } catch {
            clearInterval(heartbeat)
            clients.delete(controller)
          }
        }, 30_000)

        signal.addEventListener("abort", () => {
          clearInterval(heartbeat)
          clients.delete(controller)
          try {
            controller.close()
          } catch {
            // ปิดไปแล้วก็ถือว่าจบ
          }
        })
      },

      cancel(controller) {
        clients.delete(controller)
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        // ปิด buffering ของ nginx ไม่งั้นข้อความค้างจนกว่า buffer จะเต็ม
        "X-Accel-Buffering": "no",
      },
    })
  }
}
