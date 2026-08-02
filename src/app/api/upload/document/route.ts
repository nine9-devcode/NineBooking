import { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/api/guards"
import { apiError, apiOk, handleApiError } from "@/lib/api/response"
import { getFileValidationError } from "@/lib/file-utils"
import { deleteFile, saveFile } from "@/lib/storage"

// POST /api/upload/document — อัปโหลดเอกสาร datasheet (PDF / Word / Excel)
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return apiError("ไม่พบไฟล์ที่จะอัปโหลด")
    }

    const validationError = getFileValidationError(file)
    if (validationError) return apiError(validationError)

    const stored = await saveFile(file, "documents")

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
