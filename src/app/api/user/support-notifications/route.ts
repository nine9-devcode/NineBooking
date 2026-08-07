// app/api/user/support-notifications/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET - ดึง notification count และ list
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "count" // count | list

    if (type === "count") {
      const unreadCount = await prisma.userSupportNotification.count({
        where: {
          userId,
          isRead: false,
        },
      })

      return NextResponse.json({ unreadCount })
    }

    // ดึง list ทั้งหมด (unread ก่อน)
    const notifications = await prisma.userSupportNotification.findMany({
      where: { userId },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      take: 20,
    })

    const unreadCount = notifications.filter((n) => !n.isRead).length

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("Error fetching support notifications:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 })
  }
}
