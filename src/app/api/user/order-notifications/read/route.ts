// ไฟล์: app/api/user/order-notifications/read/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// POST - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()
    const { orderId, notificationId, markAll } = body

    // Mark all as read
    if (markAll) {
      await prisma.userOrderNotification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, message: "Marked all as read" })
    }

    // Mark by orderId (เมื่อเข้าดูหน้า Order Detail)
    if (orderId) {
      await prisma.userOrderNotification.updateMany({
        where: {
          userId,
          orderId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, message: "Marked as read" })
    }

    // Mark by notificationId
    if (notificationId) {
      // ตรวจสอบว่าเป็น notification ของ user นี้
      const notification = await prisma.userOrderNotification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      })

      if (!notification) {
        return NextResponse.json(
          { error: "ไม่พบ notification" },
          { status: 404 }
        )
      }

      await prisma.userOrderNotification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, message: "Marked as read" })
    }

    return NextResponse.json(
      { error: "กรุณาระบุ orderId, notificationId หรือ markAll" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    )
  }
}