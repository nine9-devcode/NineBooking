import { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/api/guards"
import { apiError, apiOk, handleApiError } from "@/lib/api/response"
import { deleteFile, saveFile } from "@/lib/storage"

const MAX_IMAGE_SIZE = 8 * 1024 * 1024 // 8 MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]

// POST /api/upload/image — อัปโหลดรูปเข้า public/uploads/<folder>
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const formData = await request.formData()
    const file = formData.get("file")
    const folder = (formData.get("folder") as string | null) ?? "categories"

    if (!(file instanceof File)) {
      return apiError("ไม่พบไฟล์ที่จะอัปโหลด")
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return apiError("รองรับเฉพาะไฟล์ JPG, PNG, WebP, AVIF และ GIF")
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return apiError("ไฟล์รูปใหญ่เกินไป (สูงสุด 8 MB)")
    }

    const stored = await saveFile(file, folder)

    return apiOk({ url: stored.url, publicId: stored.publicId })
  } catch (error) {
    return handleApiError(error, "upload/image")
  }
}

// DELETE /api/upload/image — ลบรูปออกจากดิสก์
export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { publicId } = (await request.json()) as { publicId?: string }

    if (!publicId) return apiError("ไม่พบ publicId ของไฟล์ที่จะลบ")

    const deleted = await deleteFile(publicId)
    if (!deleted) return apiError("ลบรูปภาพไม่สำเร็จ", 500)

    return apiOk({ message: "ลบรูปภาพสำเร็จ", publicId })
  } catch (error) {
    return handleApiError(error, "upload/image:delete")
  }
}
