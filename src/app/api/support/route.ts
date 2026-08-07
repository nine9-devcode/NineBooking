import { IssueCategory } from "@prisma/client"

import { requireUser } from "@/lib/api/guards"
import { apiError, apiOk, handleApiError, tooManyRequests } from "@/lib/api/response"
import { prisma } from "@/lib/db"
import { nextIssueNumber } from "@/lib/document-number"
import { sendNewIssueAdminEmail } from "@/lib/mailer/support-mail"
import { RATE_LIMITS, consume } from "@/lib/rate-limit"
import { broadcastIssueNotification } from "@/lib/realtime/issue-notifications"
import { saveFile } from "@/lib/storage"

const MAX_IMAGES = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const VALID_CATEGORIES = Object.values(IssueCategory)

// POST /api/support — ลูกค้าส่งเรื่องแจ้งปัญหา
export async function POST(req: Request) {
  try {
    const guard = await requireUser()
    if (!guard.ok) return guard.response
    const { user } = guard

    const rate = await consume(`support:user:${user.id}`, RATE_LIMITS.support)
    if (!rate.ok) return tooManyRequests(rate.retryAfterSec)

    const formData = await req.formData()
    const subject = ((formData.get("subject") as string) ?? "").trim()
    const description = ((formData.get("description") as string) ?? "").trim()
    const category = formData.get("category") as string
    const files = formData.getAll("files").filter((f): f is File => f instanceof File)

    if (!subject) return apiError("กรุณาระบุหัวข้อปัญหา")
    if (!description) return apiError("กรุณาอธิบายรายละเอียดปัญหา")
    if (description.length < 10) {
      return apiError("รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร")
    }
    if (!VALID_CATEGORIES.includes(category as IssueCategory)) {
      return apiError("กรุณาเลือกประเภทปัญหา")
    }

    const validFiles = files.filter((f) => f.size > 0).slice(0, MAX_IMAGES)

    // ไฟล์แนบของลูกค้าเก็บเป็น private — มักเป็นสกรีนช็อตที่มีเลขออเดอร์ ที่อยู่ เบอร์โทร
    // อยู่ใน public/ เมื่อไหร่คือใครเดา URL ถูกก็เปิดได้ทันที
    const stored = await Promise.all(
      validFiles.map((file) =>
        saveFile(file, "support-issues", {
          kind: "image",
          maxBytes: MAX_FILE_SIZE,
          visibility: "private",
        })
      )
    )
    const imageUrls = stored.map((s) => s.url)

    const { issue, notification } = await prisma.$transaction(async (tx) => {
      const issueNumber = await nextIssueNumber(tx)

      const newIssue = await tx.contactIssue.create({
        data: {
          issueNumber,
          userId: user.id,
          subject,
          description,
          category: category as IssueCategory,
          imageUrls,
          status: "PENDING",
        },
        include: {
          user: { select: { name: true, nickname: true } },
        },
      })

      const newNotification = await tx.issueNotification.create({
        data: {
          issueId: newIssue.id,
          issueNumber,
          userName: newIssue.user?.name ?? "ไม่ระบุชื่อ",
          userNickname: newIssue.user?.nickname ?? null,
          subject,
        },
      })

      return { issue: newIssue, notification: newNotification }
    })

    // ส่งกระดิ่ง real-time หลัง transaction commit แล้วเท่านั้น
    broadcastIssueNotification({
      id: notification.id,
      issueId: issue.id,
      issueNumber: notification.issueNumber,
      userName: notification.userName,
      userNickname: notification.userNickname,
      subject: notification.subject,
      isRead: false,
      createdAt: notification.createdAt.toISOString(),
    })

    // อีเมลไม่ควรบล็อกการตอบกลับ — ล้มเหลวก็แค่ log ไว้
    void sendNewIssueAdminEmail({
      issueId: issue.id,
      issueNumber: issue.issueNumber,
      customerName: issue.user?.name ?? "ไม่ระบุชื่อ",
      customerEmail: user.email ?? "",
      subject,
      category,
      description,
      createdAt: issue.createdAt,
    }).catch((err) => console.error("[support] ส่งอีเมลแจ้ง admin ไม่สำเร็จ:", err))

    return apiOk(
      {
        success: true,
        issueNumber: issue.issueNumber,
        message: "ส่งแจ้งปัญหาสำเร็จ เราจะติดต่อกลับโดยเร็วที่สุด",
      },
      201
    )
  } catch (error) {
    return handleApiError(error, "support:create")
  }
}

// GET /api/support — ประวัติการแจ้งปัญหาของผู้ใช้คนปัจจุบัน
export async function GET() {
  try {
    const guard = await requireUser()
    if (!guard.ok) return guard.response

    const issues = await prisma.contactIssue.findMany({
      where: { userId: guard.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        issueNumber: true,
        subject: true,
        description: true,
        category: true,
        imageUrls: true,
        status: true,
        adminResponse: true,
        respondedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return apiOk({ issues })
  } catch (error) {
    return handleApiError(error, "support:list")
  }
}
