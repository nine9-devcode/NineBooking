// app/api/admin/contact-issues/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { IssueStatus } from "@prisma/client"
import { sendIssueClosedCustomerEmail } from "@/lib/mailer/support-mail"
import { deleteFiles } from "@/lib/storage"

// GET: ดึงรายละเอียดปัญหา
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const issue = await prisma.contactIssue.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
            phone: true,
            image: true,
          },
        },
      },
    })

    if (!issue) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลการแจ้งปัญหา" },
        { status: 404 }
      )
    }

    return NextResponse.json(issue)

  } catch (error) {
    console.error("Error fetching issue:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

// PATCH: อัปเดตสถานะ/ตอบกลับ
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params

    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const body = await request.json()
    const { status, adminResponse } = body

    // Validate status
    const validStatuses: IssueStatus[] = ["PENDING", "IN_PROGRESS", "CLOSED"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "สถานะไม่ถูกต้อง" },
        { status: 400 }
      )
    }

    // ดึง issue เดิมเพื่อตรวจสอบ old values และ userId
    const existingIssue = await prisma.contactIssue.findUnique({
      where: { id: params.id },
      select: { status: true, adminResponse: true, userId: true, issueNumber: true, subject: true, category: true, description: true, createdAt: true },
    })

    if (!existingIssue) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 })
    }

    const updateData: any = {}

    if (status) {
      updateData.status = status
    }

    if (adminResponse !== undefined) {
      updateData.adminResponse = adminResponse
      updateData.respondedAt = new Date()
    }

    const updatedIssue = await prisma.contactIssue.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    // สร้าง UserSupportNotification ถ้า issue มี userId (ผู้ใช้ที่ล็อกอิน)
    if (existingIssue.userId) {
      const notificationsToCreate: {
        userId: string
        issueId: string
        issueNumber: string
        notificationType: string
      }[] = []

      // ตรวจสอบ status เปลี่ยน → IN_PROGRESS หรือ CLOSED
      if (status && status !== existingIssue.status) {
        if (status === "IN_PROGRESS" || status === "CLOSED") {
          notificationsToCreate.push({
            userId: existingIssue.userId,
            issueId: params.id,
            issueNumber: existingIssue.issueNumber,
            notificationType: status === "IN_PROGRESS" ? "in_progress" : "closed",
          })
        }
      }

      // ตรวจสอบ adminResponse เปลี่ยน (มีข้อความใหม่/แก้ไข)
      if (
        adminResponse !== undefined &&
        adminResponse !== existingIssue.adminResponse &&
        adminResponse.trim() !== ""
      ) {
        // ไม่ซ้ำกับ notification ที่สร้างจาก status change ในรอบเดียวกัน
        const alreadyHasStatusNotif = notificationsToCreate.length > 0
        if (!alreadyHasStatusNotif) {
          notificationsToCreate.push({
            userId: existingIssue.userId,
            issueId: params.id,
            issueNumber: existingIssue.issueNumber,
            notificationType: "response",
          })
        }
      }

      if (notificationsToCreate.length > 0) {
        await prisma.userSupportNotification.createMany({
          data: notificationsToCreate,
        })
      }
    }

    // ส่งอีเมลแจ้งลูกค้าเมื่อสถานะเปลี่ยนเป็น CLOSED (non-blocking)
    const statusChangedToClosed =
      status && status !== existingIssue.status && status === "CLOSED"

    if (statusChangedToClosed && updatedIssue.user?.email) {
      sendIssueClosedCustomerEmail({
        issueId: params.id,
        issueNumber: existingIssue.issueNumber,
        customerName: updatedIssue.user.name || 'ลูกค้า',
        customerEmail: updatedIssue.user.email,
        subject: existingIssue.subject,
        category: existingIssue.category,
        description: existingIssue.description,
        createdAt: existingIssue.createdAt,
        adminResponse: updatedIssue.adminResponse || undefined,
      }).catch((err) => console.error('Failed to send issue closed email:', err))
    }

    return NextResponse.json(updatedIssue)

  } catch (error) {
    console.error("Error updating issue:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดต" },
      { status: 500 }
    )
  }
}

// DELETE: ลบรายการแจ้งปัญหาพร้อมรูปแนบ
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params

    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    // ดึงข้อมูล issue ก่อนลบ เพื่อเอา imageUrls
    const issue = await prisma.contactIssue.findUnique({
      where: { id: params.id },
      select: { imageUrls: true },
    })

    if (!issue) {
      return NextResponse.json(
        { error: "ไม่พบรายการที่ต้องการลบ" },
        { status: 404 }
      )
    }

    await prisma.contactIssue.delete({
      where: { id: params.id },
    })

    await deleteFiles(issue.imageUrls, "private")

    return NextResponse.json({ message: "ลบรายการสำเร็จ" })

  } catch (error) {
    console.error("Error deleting issue:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบ" },
      { status: 500 }
    )
  }
}