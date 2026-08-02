import { NextResponse } from 'next/server'
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from '@/lib/db'

// GET: ดึงรายการแจ้งเตือนปัญหา
export async function GET() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const notifications = await prisma.issueNotification.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 50, // จำกัดไว้ 50 รายการล่าสุด
    })

    const unreadCount = await prisma.issueNotification.count({
      where: { isRead: false }
    })

    return NextResponse.json({ notifications, unreadCount})
  } catch (error) {
    console.error('Failed to fetch issue notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: อ่านแจ้งเตือนปัญหา
export async function PATCH(req: Request) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id, issueId } = await req.json()

    if (id) {
      // อ่านรายการเดียว
      await prisma.issueNotification.update({
        where: { id },
        data: { isRead: true }
      })
    } else if (issueId) {
      // อ่านทั้งหมดของ issue นี้
      await prisma.issueNotification.updateMany({
        where: { issueId },
        data: { isRead: true }
      })
    } else {
      // อ่านทั้งหมด
      await prisma.issueNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark issue notifications as read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: ล้างการแจ้งเตือนปัญหา
export async function DELETE() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    await prisma.issueNotification.deleteMany({})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to clear issue notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}