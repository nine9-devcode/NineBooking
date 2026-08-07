import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

// PATCH: Mark single notification as read
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    await prisma.orderNotification.update({
      where: { id },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to mark as read:", error)
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
