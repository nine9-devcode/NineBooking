// app/api/user/support-notifications/read/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// POST - Mark support notifications as read
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
    const { issueId, markAll } = body

    if (markAll) {
      await prisma.userSupportNotification.updateMany({
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

    if (issueId) {
      await prisma.userSupportNotification.updateMany({
        where: {
          userId,
          issueId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, message: "Marked as read" })
    }

    return NextResponse.json(
      { error: "กรุณาระบุ issueId หรือ markAll" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error marking support notification as read:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    )
  }
}
