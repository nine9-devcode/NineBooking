import { NextRequest } from "next/server"

import { DATASHEET_CONFIG } from "@/features/products/datasheet.types"
import { requireAdmin } from "@/lib/api/guards"
import { apiError, apiOk, handleApiError, tooManyRequests } from "@/lib/api/response"
import { RATE_LIMITS, consume } from "@/lib/rate-limit"
import { deleteFile, saveFile } from "@/lib/storage"

// POST /api/upload/document — อัปโหลดเอกสาร datasheet (PDF / Word / Excel)
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const rate = await consume(`upload:user:${guard.user.id}`, RATE_LIMITS.upload)
    if (!rate.ok) return tooManyRequests(rate.retryAfterSec)

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return apiError("ไม่พบไฟล์ที่จะอัปโหลด")
    }

    // ชนิดถูกตรวจจาก magic bytes ใน saveFile — ตัวเช็คเดิมดูแค่ file.type ที่ client ตั้งเองได้
    const stored = await saveFile(file, "documents", {
      kind: "document",
      maxBytes: DATASHEET_CONFIG.maxFileSize,
    })

    return apiOk(stored)
  } catch (error) {
    return handleApiError(error, "upload/document")
  }
}

// DELETE /api/upload/document — ลบเอกสารออกจากดิสก์
export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { publicId } = (await request.json()) as { publicId?: string }

    if (!publicId) return apiError("ไม่พบ publicId ของไฟล์ที่จะลบ")

    const deleted = await deleteFile(publicId)
    if (!deleted) return apiError("ลบไฟล์ไม่สำเร็จ", 500)

    return apiOk({ message: "ลบไฟล์สำเร็จ", publicId })
  } catch (error) {
    return handleApiError(error, "upload/document:delete")
  }
}
