import { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/api/guards"
import { apiError, apiOk, handleApiError } from "@/lib/api/response"
import { prisma } from "@/lib/db"
import { deleteFiles } from "@/lib/storage"

// DELETE /api/admin/contact-issues/bulk-delete — ลบหลายรายการพร้อมรูปแนบ
export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { ids } = (await request.json()) as { ids?: string[] }

    if (!Array.isArray(ids) || ids.length === 0) {
      return apiError("กรุณาเลือกรายการที่ต้องการลบ")
    }

    const issues = await prisma.contactIssue.findMany({
      where: { id: { in: ids } },
      select: { imageUrls: true },
    })

    const result = await prisma.contactIssue.deleteMany({
      where: { id: { in: ids } },
    })

    await deleteFiles(issues.flatMap((issue) => issue.imageUrls))

    return apiOk({ message: "ลบรายการสำเร็จ", count: result.count })
  } catch (error) {
    return handleApiError(error, "admin/contact-issues:bulk-delete")
  }
}
