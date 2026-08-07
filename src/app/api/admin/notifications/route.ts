import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/api/guards"
import { parsePagination } from "@/lib/api/query"
import { prisma } from "@/lib/db"

// GET: ดึงรายการแจ้งเตือน
export async function GET(req: Request) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(req.url)
    const { limit } = parsePagination(searchParams, { defaultLimit: 20, maxLimit: 50 })
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // ดึง notifications
    const notifications = await prisma.orderNotification.findMany({
      where: unreadOnly ? { isRead: false } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // นับจำนวนที่ยังไม่อ่าน
    const unreadCount = await prisma.orderNotification.count({
      where: { isRead: false },
    })

    // นับจำนวนทั้งหมด
    const totalCount = await prisma.orderNotification.count()

    return NextResponse.json({ 
      notifications, 
      unreadCount,
      totalCount,
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Mark all as read
export async function PATCH() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    await prisma.$transaction([
      // อัปเดตแจ้งเตือนคำสั่งจอง
      prisma.orderNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      }),
      // อัปเดตแจ้งเตือนปัญหา
      prisma.issueNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark all as read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: ล้างการแจ้งเตือนทั้งหมด
export async function DELETE() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    await prisma.$transaction([
      prisma.orderNotification.deleteMany({}),
      prisma.issueNotification.deleteMany({}) // เพิ่มส่วนนี้
    ])
    

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to clear notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
